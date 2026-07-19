import { Component, input, effect } from '@angular/core';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { UserModel } from '../../../../../@core/modules/account/entities/user.model';

@Component({
  selector: 'app-user-personal-details',
  imports: [NgbTooltipModule],
  templateUrl: './user-personal-details.html',
  styleUrl: './user-personal-details.scss',
})
export class UserPersonalDetails {
  readonly currentUser = input<UserModel.Entity | null>(null);

  public user!: UserModel.Entity;

  constructor() {
    effect(() => {
      const value = this.currentUser();
      if (value) {
        this.user = value;
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.user.avatar = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeProfile() {
    this.user.avatar = 'assets/images/user/no_avatar.png';
  }
}
