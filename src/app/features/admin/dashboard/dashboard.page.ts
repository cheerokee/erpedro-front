import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AuthService } from '../../../@core/services/auth.service';

@Component({
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  // Usuário recém-criado (sign-up direto ou aceite de convite ainda não
  // processado) pode logar sem nenhuma role/Employee/Customer vinculado a
  // uma company/holding — nesse estado não há nada pra mostrar no dashboard
  // normal, então exibimos uma tela de espera em vez do placeholder vazio.
  awaitingAccess: boolean;

  constructor(private readonly authService: AuthService) {
    const user = this.authService.getAuthenticateUser();

    this.awaitingAccess =
      !user?.roles?.length &&
      !user?.companies?.length &&
      !user?.employeeCompanyIds?.length &&
      !user?.holdingCompanyIds?.length;
  }
}
