import { Injectable } from "@angular/core";
import Swal, { SweetAlertOptions } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  async alert(options: SweetAlertOptions) {

    options.heightAuto = false;
    options.timerProgressBar = true;

    await Swal.fire(options);
  }

  /** Backend (BaseCrudController.httpException) manda a mensagem de negócio
   * específica em `err.error.message` (ex.: "Este paroquiano já possui um
   * registro de batismo") — cai no texto genérico só quando a resposta não
   * traz nenhuma (erro de rede, timeout, etc.). Substitui o padrão repetido
   * em cada form/data-list de sempre mostrar o mesmo texto fixo, escondendo
   * o motivo real do erro. */
  async alertError(
    err: any,
    fallbackText: string,
    title: string = 'Ops, houve um erro!',
  ) {
    return this.alert({
      title,
      text: err?.error?.message ?? fallbackText,
      icon: 'error',
      timer: 3000,
    });
  }

  async confirm(options: SweetAlertOptions = {}) {
    return Swal.fire({
      icon: 'question',
      title: '',
      showCancelButton: true,
      showConfirmButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sim',
      focusCancel: true,
      heightAuto: false,
      timerProgressBar: false,
      ...options
    });
  }
}
