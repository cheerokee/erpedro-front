import { Component, EventEmitter, Output, ViewChild } from '@angular/core';

import {
  ModalBody,
  ModalComponent,
  ModalFooter,
  ModalHeader,
} from '../../../../../@shared/components/modal/modal.component';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FormComponent } from '../form/form.component';

@Component({
  selector: 'app-modal-invites',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  imports: [
    SharedModule,
    ModalBody,
    ModalHeader,
    ModalFooter,
    ModalComponent,
    FormComponent,
  ],
})
export class ModalInvitesComponent {
  @Output() onSave = new EventEmitter<void>();

  @ViewChild('modal') modal: ModalComponent;
  @ViewChild('form') formComponent: FormComponent;

  show() {
    this.modal.show();
  }

  hide() {
    this.modal.hide();
  }

  saved() {
    this.hide();
    this.onSave.emit();
  }

  hideEvent() {
    // Mesmo motivo de ModalCompaniesComponent: não vazar dado de uma
    // tentativa de convite cancelada (X, backdrop, ESC) na próxima abertura.
    this.formComponent?.default();
  }
}
