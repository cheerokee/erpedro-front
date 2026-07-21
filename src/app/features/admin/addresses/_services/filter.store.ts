import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AddressModel } from '../../../../@core/modules/address/entities/address.model';

@Injectable()
export class FilterStore {
  subject = new BehaviorSubject<AddressModel.Filter>(
    new AddressModel.Filter({}),
  );
  store$ = this.subject.asObservable();

  set(filter: AddressModel.Filter) {
    this.subject.next(filter);
  }

  get() {
    return this.subject.getValue();
  }
}
