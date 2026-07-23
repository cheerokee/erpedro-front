import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';

import { SharedModule } from '../../../../../../@shared/shared.module';
import { UserSelectorComponent } from '../../../../../../@shared/components/selectors/user-selector/user-selector.component';
import { UserModel } from '../../../../../../@core/modules/account/entities/user.model';

@Component({
  selector: 'app-form-basic-company',
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss'],
  imports: [SharedModule, UserSelectorComponent],
})
export class BasicFormCompanyComponent implements OnInit, AfterViewInit {
  form: FormGroup;

  @ViewChild('userSelector') userSelectorRef: UserSelectorComponent;

  constructor(private readonly controlContainer: ControlContainer) {}

  ngOnInit() {
    this.form = this.controlContainer.control as FormGroup;
  }

  ngAfterViewInit() {
    this.autoset(this.form.get('owner_id').value);
  }

  onUserSelected(entity: UserModel.Entity | null) {
    this.form.get('owner_id').setValue(entity?.id ?? null);
    this.form.get('owner_id').markAsTouched();
  }

  /** Preseleciona o usuário em telas de edição — chamado pelo componente pai. */
  autoset(userId: string | null) {
    if (userId) this.userSelectorRef?.autoset(userId);
  }
}
