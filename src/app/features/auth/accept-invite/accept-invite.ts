import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { InviteService } from '../../../@core/modules/acl/services/invite.service';
import { InviteModel } from '../../../@core/modules/acl/entities/invite.model';
import { AlertService } from '../../../@core/services/alert.service';
import { passwordsMatchValidator } from '../../../@shared/validators/passwords-match.validator';

type AcceptInviteStatus = 'loading' | 'invalid' | 'form' | 'success';

@Component({
  selector: 'app-accept-invite',
  imports: [RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './accept-invite.html',
  styleUrl: './accept-invite.scss',
})
export class AcceptInvite implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);

  status: AcceptInviteStatus = 'loading';
  token: string;
  email: string;
  roleLabel: string;
  hasAccount = false;

  form: FormGroup;
  show = false;
  showConfirm = false;
  saving = false;

  constructor(private readonly inviteService: InviteService) {
    this.define();
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.status = 'invalid';
      return;
    }

    this.inviteService.preview(this.token).subscribe({
      next: (result) => {
        this.email = result.data.email;
        this.hasAccount = result.data.hasAccount;
        this.roleLabel =
          result.data.role_type === InviteModel.RoleTypeEnum.ADMIN ? 'responsável' : 'funcionário';

        // Conta já existe: não pede nome/senha (aceitar convite não é forma
        // de trocar a senha de outra conta — mesma regra do backend).
        if (this.hasAccount) {
          ['name', 'password', 'confirmPassword'].forEach((controlName) => {
            const control = this.form.get(controlName);
            control.clearValidators();
            control.updateValueAndValidity();
          });
        }

        this.status = 'form';
      },
      error: () => {
        this.status = 'invalid';
      },
    });
  }

  define() {
    this.form = new FormGroup({
      name: new FormControl(null, [Validators.required]),
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

    this.saving = true;

    const { name, password } = this.form.value;

    this.inviteService
      .accept({ token: this.token, name: name ?? undefined, password: password ?? undefined })
      .subscribe({
        next: () => {
          this.saving = false;
          this.status = 'success';

          setTimeout(() => this.router.navigate(['/sign-in']), 3000);
        },
        error: (err) => {
          this.saving = false;
          this.alert.alertError(err, 'Não foi possível aceitar o convite');
        },
      });
  }
}
