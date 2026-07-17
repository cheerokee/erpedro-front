export abstract class ResultList<E> {
  data: E[];
  meta: {
    current_page: number,
    last_page: number,
    per_page: number,
    total: number,
  }
}
