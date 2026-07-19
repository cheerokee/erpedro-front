import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { CustomerService } from '../../../@core/modules/general/services/customer.service';
import { CompanyService } from '../../../@core/modules/company/services/company.service';
import { AlertService } from '../../../@core/services/alert.service';
import { passwordsMatchValidator } from '../../../@shared/validators/passwords-match.validator';

type SignUpCustomerStatus = 'loading' | 'invalid-link' | 'form';

@Component({
  selector: 'app-sign-up-customer',
  imports: [RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './sign-up-customer.html',
  styleUrl: './sign-up-customer.scss',
})
export class SignUpCustomer implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);

  status: SignUpCustomerStatus = 'loading';
  companyId: string;
  companyName: string;

  form: FormGroup;
  show: boolean = false;
  showConfirm: boolean = false;
  authState = { isLoading: false };

  constructor(
    private readonly customerService: CustomerService,
    private readonly companyService: CompanyService,
  ) {
    this.define();
  }

  ngOnInit() {
    this.companyId = this.route.snapshot.queryParamMap.get('company');

    if (!this.companyId) {
      this.status = 'invalid-link';
      return;
    }

    this.companyService.getPublicInfo(this.companyId).subscribe({
      next: (result) => {
        this.companyName = result.data?.name;
        this.status = 'form';
      },
      error: () => {
        this.status = 'invalid-link';
      },
    });
  }

  define() {
    this.form = new FormGroup({
      name: new FormControl(null, [Validators.required]),
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
      ]),
      confirmPassword: new FormControl(null, Validators.required),
      document: new FormControl(null),
      phone_number: new FormControl(null),
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

    const { name, email, password, document, phone_number } = this.form.value;
    this.customerService
      .selfRegister({
        name,
        email,
        password,
        document,
        phone_number,
        company_id: this.companyId,
      })
      .subscribe({
        next: () => {
          this.authState = { isLoading: false };

          this.alert.alert({
            title: 'Cadastro criado com sucesso',
            text: 'Enviamos um link de confirmação para o seu e-mail.',
            icon: 'success',
            timer: 3000,
          });

          this.router.navigate(['/sign-in']);
        },
        error: () => {
          this.authState = { isLoading: false };

          this.alert.alert({
            title: 'Não foi possível concluir o cadastro',
            text: 'Verifique os dados informados e tente novamente.',
            icon: 'error',
            timer: 3000,
          });
        },
      });
  }
}
