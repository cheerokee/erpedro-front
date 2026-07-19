import { NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Component, inject, Input } from '@angular/core';

import { ChatService } from '../../../../../../@shared/services/chat.service';
import { Card } from '../../../../../../@shared/components/ui/card/card';
import { BasicDataComponent } from '../basic-data/basic-data.component';
import { ChangePasswordComponent } from '../change-password/change-password.component';

export enum MyDataTabEnum {
  BASIC = 'BASIC',
  PASSWORD = 'PASSWORD',
}

@Component({
  selector: 'app-my-data',
  imports: [
    NgbTooltipModule,
    NgbNavModule,
    Card,
    BasicDataComponent,
    ChangePasswordComponent,
  ],
  templateUrl: './my-data.component.html',
  styleUrl: './my-data.component.scss',
})
export class MyDataComponent {
  activeTab = MyDataTabEnum.BASIC;
  myDataTabEnum = MyDataTabEnum;
  chatService = inject(ChatService);

  @Input() user_id: string;
}
