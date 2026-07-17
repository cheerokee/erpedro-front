import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { UserService } from '../../../@core/modules/account/services/user.service';
import { AlertService } from '../../../@core/services/alert.service';
import { passwordsMatchValidator } from '../../../@shared/validators/passwords-match.validator';

@Component({
  selector: 'app-sign-up',
  imports: [RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  router = inject(Router);
  private alert = inject(AlertService);

  form: FormGroup;
  show: boolean = false;
  showConfirm: boolean = false;
  authState = { isLoading: false };

  constructor(private readonly userService: UserService) {
    this.define();
  }

  define() {
    this.form = new FormGroup({
      name: new FormControl(null),
      email: new FormControl(null, [Validators.required, Validators.email]),
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
    if (!this.form.valid) return;

    this.authState = { isLoading: true };

    const { name, email, password } = this.form.value;
    this.userService.signUp({ name, email, password }).subscribe({
      next: () => {
        this.authState = { isLoading: false };

        this.alert.alert({
          title: 'Conta criada com sucesso',
          text: 'Enviamos um link de confirmação para o seu e-mail.',
          icon: 'success',
          timer: 3000,
        });

        this.router.navigate(['/sign-in']);
      },
      error: () => {
        this.authState = { isLoading: false };

        this.alert.alert({
          title: 'Não foi possível criar sua conta',
          text: 'Verifique os dados informados e tente novamente.',
          icon: 'error',
          timer: 3000,
        });
      },
    });
  }
}
