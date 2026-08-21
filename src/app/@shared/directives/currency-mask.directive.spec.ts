import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { CurrencyMaskDirective } from './currency-mask.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyMaskDirective],
  template: `<input type="text" appCurrencyMask [formControl]="control" />`,
})
class HostComponent {
  control = new FormControl<number | null>(null);
}

describe('CurrencyMaskDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: HostComponent;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  });

  function typeDigits(digits: string) {
    input.value = digits;
    input.dispatchEvent(new Event('input'));
  }

  it('formata o valor inicial do FormControl (writeValue)', () => {
    component.control.setValue(1234.56);
    fixture.detectChanges();

    expect(input.value).toBe('R$ 1.234,56');
  });

  it('mostra vazio quando o valor é null', () => {
    component.control.setValue(1234.56);
    fixture.detectChanges();

    component.control.setValue(null);
    fixture.detectChanges();

    expect(input.value).toBe('');
  });

  it('empurra os dígitos da direita pra esquerda ao digitar (estilo caixa eletrônico)', () => {
    typeDigits('1');
    expect(input.value).toBe('R$ 0,01');
    expect(component.control.value).toBe(0.01);

    typeDigits('12');
    expect(input.value).toBe('R$ 0,12');

    typeDigits('123');
    expect(input.value).toBe('R$ 1,23');

    typeDigits('123456');
    expect(input.value).toBe('R$ 1.234,56');
    expect(component.control.value).toBe(1234.56);
  });

  it('ignora caracteres não numéricos (ex.: usuário digitando por cima do "R$")', () => {
    typeDigits('R$ 1.234,56abc');

    expect(input.value).toBe('R$ 1.234,56');
    expect(component.control.value).toBe(1234.56);
  });

  it('volta a null quando todos os dígitos são apagados', () => {
    typeDigits('123');
    typeDigits('');

    expect(input.value).toBe('');
    expect(component.control.value).toBeNull();
  });

  it('desabilita o input quando o FormControl é desabilitado', () => {
    component.control.disable();
    fixture.detectChanges();

    expect(input.disabled).toBe(true);
  });
});
