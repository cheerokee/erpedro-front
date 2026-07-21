import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, take } from 'rxjs';

import { AddressService } from '../../../../../@core/modules/address/services/address.service';
import { AddressModel } from '../../../../../@core/modules/address/entities/address.model';
import { AlertService } from '../../../../../@core/services/alert.service';
import { ResultModel } from '../../../../../@core/models/result.model';
import { SharedModule } from '../../../../../@shared/shared.module';

export type FormDataAddress = AddressModel.JsonProps;

@Component({
  selector: 'app-form-addresses',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [SharedModule],
})
export class FormComponent {
  form: FormGroup;
  @Output() onSave = new EventEmitter<void>();

  constructor(
    private formBuilder: FormBuilder,
    private addressService: AddressService,
    private alertService: AlertService,
  ) {
    this.define();
  }

  define() {
    this.form = this.formBuilder.group({});

    this.default();
  }

  default() {
    this.form.setValue({});
  }

  submit() {
    const data: FormDataAddress = this.form.value;
    let obs$: Observable<ResultModel<any>>;

    if (data.id) {
      const id = data.id;
      delete data.id;
      obs$ = this.addressService.update(id, data);
    } else {
      obs$ = this.addressService.create(data);
    }

    obs$.pipe(take(1)).subscribe({
      next: (result) => {
        console.log(result);
        this.alertService.alert({
          title: 'Sucesso',
          text: 'Registro salvo com sucesso',
          icon: 'success',
          timer: 3000,
        });
        this.onSave.emit();
        this.default();
      },
      error: (err) => {
        this.alertService.alert({
          title: 'Ops, houve um erro!',
          text: 'Não foi possível cadastrar ou atualizar o registro',
          icon: 'error',
          timer: 3000,
        });
      },
    });
  }
}
