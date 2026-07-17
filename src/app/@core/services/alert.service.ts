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
