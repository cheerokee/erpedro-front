import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../../../@shared/shared.module';
import { AddressFormListComponent } from '../../../../../../@shared/components/form-lists/address-form-list/address-form-list.component';
import { ControlContainer, FormGroup } from '@angular/forms';
import { AddressModel } from '../../../../../../@core/modules/address/entities/address.model';

@Component({
  selector: 'app-form-addresses-employee',
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss'],
  imports: [SharedModule, AddressFormListComponent],
})
export class AddressesComponent implements OnInit {
  addresses: AddressModel.Entity[] = [];
  form: FormGroup;

  constructor(private controlContainer: ControlContainer) {}

  ngOnInit() {
    this.form = this.controlContainer.control as FormGroup;
    // Reaplica a lista quando o ngbNav recria essa aba (destroyOnHide) — o
    // form (fonte da verdade) sobrevive à troca de aba, o estado local
    // `addresses` não.
    this.autoset();
  }

  autoset() {
    this.addresses =
      this.form.get('addresses').value?.map((item) => {
        return AddressModel.Entity.toEntity(item);
      }) ?? [];
  }

  formListChange(addresses: AddressModel.Entity[]) {
    this.form.get('addresses').setValue(
      addresses.map((address) => address.toModel()),
    );
  }
}
