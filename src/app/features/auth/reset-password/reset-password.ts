import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AlertService } from '../../../@core/services/alert.service';
import { AuthService } from '../../../@core/services/auth.service';
import { passwordsMatchValidator } from '../../../@shared/validators/passwords-match.validator';

@Component({
  selector: 'app-reset-password',
  imports: [RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);

  form: FormGroup;
  show: boolean = false;
  showConfirm: boolean = false;
  authState = { isLoading: false };
  private token: string | null = null;

  constructor(private readonly authService: AuthService) {
    this.token = this.route.snapshot.queryParamMap.get('token');

    this.form = new FormGroup({
      password: new FormControl(null, [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
      ]),
      confirmPassword: new FormControl(null, Validators.required),
    });

    this.form.setValidators(passwordsMatchValidator());

    if (!this.token) {
      this.alert.alert({
        title: 'Link inválido',
        text: 'Solicite um novo link de redefinição de senha.',
        icon: 'error',
        timer: 3000,
      });

      this.router.navigate(['/forgot-password']);
    }
  }

  showPassword() {
    this.show = !this.show;
  }

  showConfirmPassword() {
    this.showConfirm = !this.showConfirm;
  }

  submit() {
    if (!this.form.valid || !this.token) return;

    this.authState = { isLoading: true };

    const { password } = this.form.value;
    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.authState = { isLoading: false };

        this.alert.alert({
          title: 'Senha redefinida com sucesso',
          icon: 'success',
          timer: 3000,
        });

        this.router.navigate(['/sign-in']);
      },
      error: () => {
        this.authState = { isLoading: false };

        this.alert.alert({
          title: 'Não foi possível redefinir sua senha',
          text: 'O link pode ter expirado. Solicite um novo.',
          icon: 'error',
          timer: 3000,
        });
      },
    });
  }
}
