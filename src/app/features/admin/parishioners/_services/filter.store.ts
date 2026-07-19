import { BehaviorSubject, Observable } from 'rxjs';
import { CustomerModel } from '../../../../@core/modules/general/entities/customer.model';
import { Injectable } from '@angular/core';

@Injectable()
export class FilterStore {
  subject = new BehaviorSubject<CustomerModel.Filter>(
    new CustomerModel.Filter({}),
  );
  store$ = this.subject.asObservable();

  set(filter: CustomerModel.Filter) {
    this.subject.next(filter);
  }

  get() {
    return this.subject.getValue();
  }
}
