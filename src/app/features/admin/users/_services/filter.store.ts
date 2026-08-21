import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';

import { UserModel } from '../../../../@core/modules/account/entities/user.model';

@Injectable()
export class FilterStore {
  subject = new BehaviorSubject<UserModel.Filter>(new UserModel.Filter({}));
  store$ = this.subject.asObservable();

  set(filter: UserModel.Filter) {
    this.subject.next(filter);
  }

  get() {
    return this.subject.getValue();
  }
}
