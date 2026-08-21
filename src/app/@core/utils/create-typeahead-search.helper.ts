import { Observable } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

const MAX_RESULTS = 10;

// Fábrica da função de busca do [ngbTypeahead] — filtra em memória a lista
// de sugestões já carregada (sem round-trip por tecla digitada). `getValues`
// é uma função (não um array direto) pra sempre ler a lista atual, mesmo
// que ela só termine de carregar depois do ngbTypeahead já estar montado
// no form (ver FormComponent.loadSuggestions nos forms de sacramento).
export function createTypeaheadSearch(getValues: () => string[]) {
  return (text$: Observable<string>): Observable<string[]> =>
    text$.pipe(
      debounceTime(150),
      map((term) => {
        const values = getValues();
        if (!term) return values.slice(0, MAX_RESULTS);

        const lower = term.toLowerCase();
        return values.filter((value) => value.toLowerCase().includes(lower)).slice(0, MAX_RESULTS);
      }),
    );
}
