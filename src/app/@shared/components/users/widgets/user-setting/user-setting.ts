import { Component } from '@angular/core';

import { Select2Module } from 'ng-select2-component';

import { Card } from '../../../ui/card/card';
import { FeatherIcon } from '../../../ui/feather-icon/feather-icon';
import { languages } from '../../../../data/user';

@Component({
  selector: 'app-user-setting',
  imports: [Select2Module, Card, FeatherIcon],
  templateUrl: './user-setting.html',
  styleUrl: './user-setting.scss',
})
export class UserSetting {
  public languages = languages;
}
