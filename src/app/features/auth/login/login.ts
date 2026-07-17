import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../@core/services/auth.service';
import { AuthObserver } from '../../../@core/observers/auth.observer';
import { UserService } from '../../../@core/modules/account/services/user.service';
import { CompanyService } from '../../../@core/modules/company/services/company.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  router = inject(Router);
  private toast = inject(ToastrService);

  form: FormGroup;
  show: boolean = false;
  validate: boolean = false;
  authState = { isLoading: false };

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly companyService: CompanyService,
  ) {
    this.define();
  }

  define() {
    this.form = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, Validators.required),
    });

    if (environment.envName === 'development') {
      this.form.setValue({
        email: 'user@email.com',
        password: '123456',
      });
    }

    const storage = localStorage.getItem(`${environment.namekey}_token`);
    if (storage) this.authService.signInSuccess();

    this.default();
  }

  default() {
    this.form.setValue({
      email: null,
      password: null,
    });
  }

  showPassword() {
    this.show = !this.show;
  }

  submit() {
    this.authState = { isLoading: true };
    const authObserver = this.buildObserver(this.form.value);

    const obs$: Observable<any> = this.authService.signIn(this.form.value);
    obs$.subscribe(authObserver);

    // this.validate = true;
    //
    // console.log(this.form.value);
    //
    // // this.router.navigate(['/dashboard/default']);
    //
    // this.toast.error(
    //   'Por favor, entre com email ou senha válida...!',
    //   'Credenciais inválidas',
    //   {
    //     positionClass: 'toast-top-right',
    //     closeButton: true,
    //     timeOut: 4000,
    //   },
    // );
  }

  buildObserver(credentials: {
    email: string;
    password: string;
  }): AuthObserver {
    return new AuthObserver(this.authService, this.authState, this.userService);
  }
}
