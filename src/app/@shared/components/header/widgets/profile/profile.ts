import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SweetAlertOptions } from 'sweetalert2';

import { getAuthenticatedUser } from '../../../../../@core/utils/get-authenticated-user.helper';
import { AlertService } from '../../../../../@core/services/alert.service';
import { FeatherIcon } from '../../../ui/feather-icon/feather-icon';
import {
  AuthenticatedUser,
  AuthService,
} from '../../../../../@core/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [RouterModule, FeatherIcon],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  authenticatedUser: AuthenticatedUser;
  private router = inject(Router);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  public profile = [
    // {
    //   id: 1,
    //   title: 'Meu Perfil',
    //   icon: 'user',
    //   path: '',
    // },
    // {
    //   id: 2,
    //   title: 'Configurações',
    //   icon: 'settings',
    //   path: '/settings',
    // },
  ];

  ngOnInit() {
    this.authenticatedUser = getAuthenticatedUser();

    if (this.authenticatedUser) {
      const profileMenu = this.profile.find((item) => item.id === 1);

      if (profileMenu) {
        profileMenu.path = `/admin/user/user-profile/${this.authenticatedUser.sub}`;
      }
    }
  }

  async signOut() {
    const options: SweetAlertOptions = {
      title: 'Atenção',
      text: 'Você tem certeza que deseja sair?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, quero sair',
      cancelButtonText: 'Cancelar',
    };

    const result = await this.alertService.confirm(options);

    if (result.isConfirmed) {
      await this.authService.signOut();
    }
  }
}
