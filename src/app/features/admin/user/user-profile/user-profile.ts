import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { UserPersonalDetails } from '../../../../@shared/components/users/widgets/user-personal-details/user-personal-details';
import { UserModel } from '../../../../@core/modules/account/entities/user.model';
import { MyDataComponent } from './_components/my-data/my-data.component';
import { Card } from '../../../../@shared/components/ui/card/card';
import { ITabs } from '../../../../@shared/interface/common';

@Component({
  selector: 'app-user-profile',
  imports: [NgbNavModule, UserPersonalDetails, Card, MyDataComponent],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfile {
  private route = inject(ActivatedRoute);

  public activeTab: string = 'my_data';

  public users: UserModel.Entity[] = [
    new UserModel.Entity({
      id: '8acc7ffe-e812-4b97-aa3c-57367c6ec8e3',
      name: 'Robert Deniro',
      email: 'user@email.com',
    }),
  ];
  public currentUser: UserModel.Entity;

  public userDetailsTab: ITabs[] = [
    {
      id: 1,
      title: 'Meus Dados',
      value: 'my_data',
      icon: 'fa-solid fa-timeline',
    },
  ];

  ngOnInit() {
    this.route.params.subscribe((params) => {
      console.log(params['id'], this.users);
      const user = this.users.find((user) => user.id === params['id']);
      if (user) {
        this.currentUser = user;
      }
    });
  }
}
