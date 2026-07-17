import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AlertService } from '../../../@core/services/alert.service';
import { AuthService } from '../../../@core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  router = inject(Router);
  private alert = inject(AlertService);

  form: FormGroup;
  authState = { isLoading: false };

  constructor(private readonly authService: AuthService) {
    this.form = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
    });
  }

  submit() {
    if (!this.form.valid) return;

    this.authState = { isLoading: true };

    const { email } = this.form.value;
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.authState = { isLoading: false };

        this.alert.alert({
          title: 'Verifique seu e-mail',
          text: 'Se o e-mail informado estiver cadastrado, enviamos um link para redefinir sua senha.',
          icon: 'success',
          timer: 4000,
        });

        this.router.navigate(['/sign-in']);
      },
      error: () => {
        this.authState = { isLoading: false };

        this.alert.alert({
          title: 'Não foi possível enviar o e-mail',
          text: 'Tente novamente em instantes.',
          icon: 'error',
          timer: 3000,
        });
      },
    });
  }
}
