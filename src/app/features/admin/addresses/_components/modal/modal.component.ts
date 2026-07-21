import { Component, ViewChild } from '@angular/core';

import {
  ModalBody,
  ModalComponent,
  ModalHeader,
} from '../../../../../@shared/components/modal/modal.component';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FormComponent } from '../form/form.component';

@Component({
  selector: 'app-modal-addresses',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  imports: [
    SharedModule,
    ModalBody,
    ModalHeader,
    ModalComponent,
    FormComponent,
  ],
})
export class ModalAddressesComponent {
  @ViewChild('modal') modal: ModalComponent;

  show(id: string = null) {
    this.modal.show();
  }

  hide() {
    this.modal.hide();
  }

  hideEvent() {
    console.log('hideEvent');
  }
}
