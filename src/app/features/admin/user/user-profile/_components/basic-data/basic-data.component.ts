import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs';

import { UserService } from '../../../../../../@core/modules/account/services/user.service';
import { AlertService } from '../../../../../../@core/services/alert.service';
import { SharedModule } from '../../../../../../@shared/shared.module';

@Component({
  selector: 'app-basic-data',
  templateUrl: './basic-data.component.html',
  styleUrls: ['./basic-data.component.scss'],
  imports: [SharedModule],
})
export class BasicDataComponent implements OnInit {
  @Input() user_id: string;

  form: FormGroup;
  isLoading: boolean = false;
  isFetching: boolean = false;

  constructor(
    private readonly userService: UserService,
    private readonly alertService: AlertService,
  ) {
    this.define();
  }

  ngOnInit() {
    if (this.user_id) {
      this.fetch();
    }
  }

  define() {
    this.form = new FormGroup({
      name: new FormControl(null, [
        Validators.required,
        Validators.maxLength(100),
      ]),
      email: new FormControl(null, [Validators.required, Validators.email]),
    });
  }

  fetch() {
    this.isFetching = true;

    this.userService
      .get(this.user_id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.isFetching = false;

          if (result.success && result.data) {
            this.form.setValue({
              name: result.data.name,
              email: result.data.email,
            });
          }
        },
        error: () => {
          this.isFetching = false;

          this.alertService.alert({
            title: 'Ops, houve um erro!',
            text: 'Não foi possível carregar os dados do usuário.',
            icon: 'error',
            timer: 3000,
          });
        },
      });
  }

  submit() {
    if (!this.form.valid || this.isLoading) return;

    this.isLoading = true;

    const { name, email } = this.form.value;

    this.userService
      .update(this.user_id, { name, email })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isLoading = false;

          this.alertService.alert({
            title: 'Sucesso',
            text: 'Dados atualizados com sucesso!',
            icon: 'success',
            timer: 3000,
          });
        },
        error: () => {
          this.isLoading = false;

          this.alertService.alert({
            title: 'Ops, houve um erro!',
            text: 'Não foi possível atualizar os dados. Tente novamente.',
            icon: 'error',
            timer: 3000,
          });
        },
      });
  }
}
