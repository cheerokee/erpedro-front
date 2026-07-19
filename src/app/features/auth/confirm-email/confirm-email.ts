import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../@core/services/auth.service';

type ConfirmEmailStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-confirm-email',
  imports: [RouterModule],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.scss',
})
export class ConfirmEmail implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);

  status: ConfirmEmailStatus = 'loading';

  constructor(private readonly authService: AuthService) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status = 'error';
      return;
    }

    this.authService.confirmEmail(token).subscribe({
      next: () => {
        this.status = 'success';

        setTimeout(() => this.router.navigate(['/sign-in']), 3000);
      },
      error: () => {
        this.status = 'error';
      },
    });
  }
}
