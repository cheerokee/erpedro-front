import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Observable, of, switchMap, take } from 'rxjs';
import {
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLink,
  NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';

import {
  CreateUserAdminData,
  UpdateUserAdminData,
  UserService,
} from '../../../../../@core/modules/account/services/user.service';
import { UserModel } from '../../../../../@core/modules/account/entities/user.model';
import { EmployeeService } from '../../../../../@core/modules/general/services/employee.service';
import { EmployeeModel } from '../../../../../@core/modules/general/entities/employee.model';
import { CustomerService } from '../../../../../@core/modules/general/services/customer.service';
import { CustomerModel } from '../../../../../@core/modules/general/entities/customer.model';
import { AlertService } from '../../../../../@core/services/alert.service';
import { ResultModel } from '../../../../../@core/models/result.model';
import { IVerticalValidation } from '../../../../../@shared/interface/form-layout';
import { passwordsMatchValidator } from '../../../../../@shared/validators/passwords-match.validator';
import { SharedModule } from '../../../../../@shared/shared.module';
import { BasicFormUserComponent } from './basic/basic.component';
import { UserRepresentationRow } from './basic/representations/representations.component';
import { RolesFormUserComponent } from './roles/roles.component';
import { PasswordFormUserComponent } from './password/password.component';

export enum UserTabEnum {
  BASIC = 'BASIC',
  ROLES = 'ROLES',
  PASSWORD = 'PASSWORD',
}

export enum UserTabEnumTitle {
  BASIC = 'Dados Gerais',
  ROLES = 'Perfis',
  PASSWORD = 'Senha',
}

export enum UserTabEnumText {
  BASIC = 'Nome, email e vínculos',
  ROLES = 'Perfis atribuídos',
  PASSWORD = 'Definir ou trocar senha',
}

@Component({
  selector: 'app-form-users',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    SharedModule,
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavOutlet,
    NgbNavContent,
    BasicFormUserComponent,
    RolesFormUserComponent,
    PasswordFormUserComponent,
  ],
})
export class FormComponent implements OnChanges, OnInit {
  form: FormGroup;
  userTabEnum = UserTabEnum;
  verticalValidation: IVerticalValidation[] = [
    {
      id: 1,
      title: UserTabEnumTitle.BASIC,
      value: UserTabEnum.BASIC,
      text: UserTabEnumText.BASIC,
      class: 'user',
    },
    {
      id: 2,
      title: UserTabEnumTitle.ROLES,
      value: UserTabEnum.ROLES,
      text: UserTabEnumText.ROLES,
      class: 'shield',
    },
    {
      id: 3,
      title: UserTabEnumTitle.PASSWORD,
      value: UserTabEnum.PASSWORD,
      text: UserTabEnumText.PASSWORD,
      class: 'lock',
    },
  ];
  active = 1;
  saving = false;

  changeTab(value: number) {
    this.active = value;
  }

  @Input() id: string;
  @Output() onSave = new EventEmitter<void>();
  @ViewChild('formBasic') formBasic: BasicFormUserComponent;

  /** Vínculos (colaborador/paroquiano) já persistidos no carregamento — usado
   * pra diferenciar quais foram removidos ao sincronizar no submit() (mesmo
   * truque de originalAddressIds em Paroquianos). */
  private originalRepresentations: { type: 'employee' | 'customer'; entity_id: string }[] = [];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserService,
    private readonly employeeService: EmployeeService,
    private readonly customerService: CustomerService,
    private readonly alertService: AlertService,
  ) {
    this.define();
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['id'] && changes['id'].previousValue !== changes['id'].currentValue) {
      this.active = 1;

      if (this.id) {
        this.load();
      } else {
        this.default();
      }
    }
  }

  define() {
    this.form = this.formBuilder.group({
      id: [null],
      name: [null, Validators.required],
      email: [null, [Validators.required, Validators.email]],
      representations: [[]],
      role_ids: [[]],
      passwordGroup: this.formBuilder.group(
        {
          password: [null, [Validators.minLength(6)]],
          confirmPassword: [null],
        },
        { validators: passwordsMatchValidator() },
      ),
    });

    this.default();
  }

  default() {
    this.active = 1;

    this.form.setValue({
      id: null,
      name: null,
      email: null,
      representations: [],
      role_ids: [],
      passwordGroup: { password: null, confirmPassword: null },
    });
    this.originalRepresentations = [];
    this.setPasswordRequired(true);

    this.formBasic?.autoset();
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  load() {
    this.userService
      .get(this.id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          if (result.success && result.data) {
            const data = result.data as any;

            this.form.patchValue({
              id: data.id,
              name: data.name ?? null,
              email: data.email ?? null,
              role_ids: (data.roles ?? []).map((role: any) => role.id),
            });
            this.setPasswordRequired(false);
            this.loadRepresentations(data.id);
          }
        },
        error: () => {
          this.alertService.alert({
            title: 'Ops, houve um erro!',
            text: 'Não foi possível carregar o registro',
            icon: 'error',
            timer: 3000,
          });
        },
      });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const passwordGroup = this.form.get('passwordGroup') as FormGroup;
    const password: string | null = passwordGroup.get('password').value;
    const confirmPassword: string | null = passwordGroup.get('confirmPassword').value;

    if (password && !confirmPassword) {
      passwordGroup.get('confirmPassword').setErrors({ required: true });
      passwordGroup.get('confirmPassword').markAsTouched();
      return;
    }

    const id: string | null = this.form.get('id').value;
    const name: string = this.form.get('name').value;
    const email: string = this.form.get('email').value;
    const roleIds: string[] = this.form.get('role_ids').value ?? [];
    const representations: UserRepresentationRow[] =
      this.form.get('representations').value ?? [];

    this.saving = true;

    let obs$: Observable<ResultModel<any>>;

    if (id) {
      const data: UpdateUserAdminData = { name, email, roleIds };
      if (password) data.password = password;
      obs$ = this.userService.updateByAdmin(id, data);
    } else {
      const data: CreateUserAdminData = { name, email, password: password as string, roleIds };
      obs$ = this.userService.createByAdmin(data);
    }

    obs$
      .pipe(
        take(1),
        switchMap((result) => {
          const userId = id ?? result.data?.id;
          return this.syncRepresentations(userId, representations);
        }),
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.alertService.alert({
            title: 'Sucesso',
            text: 'Registro salvo com sucesso',
            icon: 'success',
            timer: 3000,
          });
          this.default();
          this.onSave.emit();
        },
        error: () => {
          this.saving = false;
          this.alertService.alert({
            title: 'Ops, houve um erro!',
            text: 'Não foi possível cadastrar ou atualizar o registro',
            icon: 'error',
            timer: 3000,
          });
        },
      });
  }

  private setPasswordRequired(required: boolean) {
    const passwordCtrl = this.form.get('passwordGroup.password');
    const confirmCtrl = this.form.get('passwordGroup.confirmPassword');

    passwordCtrl.setValidators(
      required ? [Validators.required, Validators.minLength(6)] : [Validators.minLength(6)],
    );
    confirmCtrl.setValidators(required ? [Validators.required] : []);

    passwordCtrl.updateValueAndValidity();
    confirmCtrl.updateValueAndValidity();
  }

  /** Descobre os vínculos já existentes (colaborador/paroquiano que já
   * apontam pra esse user_id) — não há endpoint reverso no backend, então
   * reaproveita o filtro `user_id` (eq) já suportado por
   * EmployeeModel.Filter/CustomerModel.Filter. */
  private loadRepresentations(userId: string) {
    forkJoin({
      employees: this.employeeService.list(
        new EmployeeModel.Filter({ user_id: userId }),
        1,
        1000,
      ),
      customers: this.customerService.list(
        new CustomerModel.Filter({ user_id: userId }),
        1,
        1000,
      ),
    })
      .pipe(take(1))
      .subscribe({
        next: ({ employees, customers }) => {
          const rows: UserRepresentationRow[] = [
            ...employees.items.map(
              (item): UserRepresentationRow => ({
                type: 'employee',
                company_id: item.company?.id ?? '',
                company_name: item.company?.name ?? '-',
                entity_id: item.id,
                entity_name: item.name ?? '-',
              }),
            ),
            ...customers.items.map(
              (item): UserRepresentationRow => ({
                type: 'customer',
                company_id: item.company?.id ?? '',
                company_name: item.company?.name ?? '-',
                entity_id: item.id,
                entity_name: item.name ?? '-',
              }),
            ),
          ];

          this.form.get('representations').setValue(rows);
          this.originalRepresentations = rows.map((row) => ({
            type: row.type,
            entity_id: row.entity_id,
          }));

          this.formBasic?.autoset();
        },
      });
  }

  /** Client-orchestrated, mesmo espírito de syncAddresses em Paroquianos: sem
   * endpoint dedicado, cada vínculo atual/removido vira um PUT separado em
   * Employee/Customer (`user_id`). Não é atômico — ver AI_CONTEXT §7. */
  private syncRepresentations(
    userId: string,
    representations: UserRepresentationRow[],
  ): Observable<any> {
    const currentKeys = representations.map((row) => `${row.type}:${row.entity_id}`);
    const removed = this.originalRepresentations.filter(
      (row) => !currentKeys.includes(`${row.type}:${row.entity_id}`),
    );

    const requests: Observable<any>[] = [
      ...representations.map((row) =>
        row.type === 'employee'
          ? this.employeeService.update(row.entity_id, { user_id: userId } as any)
          : this.customerService.update(row.entity_id, { user_id: userId } as any),
      ),
      ...removed.map((row) =>
        row.type === 'employee'
          ? this.employeeService.update(row.entity_id, { user_id: null } as any)
          : this.customerService.update(row.entity_id, { user_id: null } as any),
      ),
    ];

    return requests.length > 0 ? forkJoin(requests) : of(null);
  }
}
