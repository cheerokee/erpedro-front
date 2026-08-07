import { Component, OnInit } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';

import { SharedModule } from '../../../../../../@shared/shared.module';
import {
  RepresentationsFormUserComponent,
  UserRepresentationRow,
} from './representations/representations.component';

@Component({
  selector: 'app-form-basic-user',
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss'],
  imports: [SharedModule, RepresentationsFormUserComponent],
})
export class BasicFormUserComponent implements OnInit {
  form: FormGroup;
  representations: UserRepresentationRow[] = [];

  constructor(private readonly controlContainer: ControlContainer) {}

  ngOnInit() {
    this.form = this.controlContainer.control as FormGroup;
    // Reaplica a lista quando o ngbNav recria essa aba (destroyOnHide) — o
    // form (fonte da verdade) sobrevive à troca de aba, o estado local
    // `representations` não (mesmo padrão de AddressesComponent, Paroquianos).
    this.autoset();
  }

  autoset() {
    this.representations = this.form.get('representations').value ?? [];
  }

  formListChange(representations: UserRepresentationRow[]) {
    this.form.get('representations').setValue(representations);
  }
}
