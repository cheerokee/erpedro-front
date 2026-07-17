import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../modules/account/services/user.service';

export class AuthObserver {
  constructor(
    private authService: AuthService,
    private authState: { isLoading: boolean },
    private userService: UserService,
  ) {}

  async next(response) {
    this.authService.setToken(response.data.access_token);
    this.authService.setRefreshToken(response.data.refresh_token);

    const authenticatedUser = this.authService.getAuthenticateUser();

    this.authService.authenticated$.next(authenticatedUser);
    this.authState.isLoading = false;
    this.authService.signInSuccess();
  }

  error(error) {
    const alert = new AlertService();

    alert.alert({
      title: 'Usuário ou senha incorreto',
      icon: 'error',
      timer: 3000,
    });
  }
}
