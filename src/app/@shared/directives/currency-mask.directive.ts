import { Directive, ElementRef, forwardRef, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const CURRENCY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// Intl.NumberFormat('pt-BR', {style:'currency'}) usa um espaço non-breaking
// (U+00A0) entre "R$" e o número — visualmente idêntico a um espaço comum,
// mas byte diferente; normaliza pra evitar estranheza em qualquer lugar que
// compare/copie esse texto depois. String.fromCharCode (em vez do caractere
// literal) pra ficar inequívoco no source.
const NON_BREAKING_SPACE = String.fromCharCode(160);

// Máscara monetária estilo "caixa eletrônico": cada dígito digitado empurra
// os anteriores pra esquerda (1 -> "R$ 0,01", 12 -> "R$ 0,12", 123 -> "R$
// 1,23"...) — evita todo o problema de posicionar cursor em separador
// decimal/milhar, já que o usuário só digita/apaga a partir da direita.
// Mesmo padrão usado por ngx-currency/apps bancários. O FormControl por
// trás continua um number puro (ex.: 1234.56) — a formatação é só de
// exibição.
//
// Implementado como ControlValueAccessor próprio (em vez de instalar
// ngx-mask/ngx-currency) porque nenhuma das duas libs tem peerDependencies
// compatível com o Angular 21 deste projeto (ngx-mask exige ^22,
// ngx-currency exige ^19) — forçar a instalação arriscaria quebrar em cima
// de uma versão não suportada.
//
// Uso: troca o <input type="number" ...> por
// <input type="text" appCurrencyMask formControlName="..." />
@Directive({
  selector: 'input[appCurrencyMask]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyMaskDirective),
      multi: true,
    },
  ],
})
export class CurrencyMaskDirective implements ControlValueAccessor {
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly el: ElementRef<HTMLInputElement>) {
    this.el.nativeElement.setAttribute('inputmode', 'decimal');
  }

  writeValue(value: number | null): void {
    this.el.nativeElement.value = this.format(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    const value = digits ? Number(digits) / 100 : null;

    input.value = this.format(value);
    this.onChange(value);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  private format(value: number | null): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '';

    return CURRENCY_FORMATTER.format(value).split(NON_BREAKING_SPACE).join(' ');
  }
}
