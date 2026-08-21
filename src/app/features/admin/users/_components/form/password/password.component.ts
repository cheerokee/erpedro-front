import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';

import { SharedModule } from '../../../../../../@shared/shared.module';

@Component({
  selector: 'app-form-password-user',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.scss'],
  imports: [SharedModule],
})
export class PasswordFormUserComponent implements OnInit {
  /** true em edição — só troca a senha se os campos forem preenchidos. */
  @Input() isEdit = false;

  passwordGroup: FormGroup;

  constructor(private readonly controlContainer: ControlContainer) {}

  ngOnInit() {
    this.passwordGroup = (this.controlContainer.control as FormGroup).get(
      'passwordGroup',
    ) as FormGroup;
  }
}
