import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Component, Input } from '@angular/core';
import { take } from 'rxjs';

import { passwordsMatchValidator } from '../../../../../../@shared/validators/passwords-match.validator';
import { UserService } from '../../../../../../@core/modules/account/services/user.service';
import { AlertService } from '../../../../../../@core/services/alert.service';
import { SharedModule } from '../../../../../../@shared/shared.module';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  imports: [SharedModule],
})
export class ChangePasswordComponent {
  @Input() user_id: string;

  form: FormGroup;
  show: boolean = false;
  showConfirm: boolean = false;
  isLoading: boolean = false;

  constructor(
    private readonly userService: UserService,
    private readonly alertService: AlertService,
  ) {
    this.define();
  }

  define() {
    this.form = new FormGroup({
      password: new FormControl(null, [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
      ]),
      confirmPassword: new FormControl(null, Validators.required),
    });

    this.form.setValidators(passwordsMatchValidator());
  }

  showPassword() {
    this.show = !this.show;
  }

  showConfirmPassword() {
    this.showConfirm = !this.showConfirm;
  }

  submit() {
    if (!this.form.valid || this.isLoading) return;

    this.isLoading = true;

    const { password } = this.form.value;

    this.userService
      .update(this.user_id, { password })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.define();

          this.alertService.alert({
            title: 'Sucesso',
            text: 'Senha atualizada com sucesso!',
            icon: 'success',
            timer: 3000,
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.alertError(err, 'Não foi possível atualizar a senha. Tente novamente.');
        },
      });
  }
}
