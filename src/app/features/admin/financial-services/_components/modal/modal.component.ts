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
  selector: 'app-modal-financial-services',
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
export class ModalFinancialServicesComponent {
  id: string | null = null;
  @Output() onSave = new EventEmitter<void>();

  @ViewChild('modal') modal: ModalComponent;
  @ViewChild('form') formComponent: FormComponent;

  show(id: string = null) {
    this.id = id;
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
    this.id = null;
  }
}
