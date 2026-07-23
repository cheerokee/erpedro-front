import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

import { CompanyModel } from '../../../../@core/modules/company/entities/company.model';

@Injectable()
export class FilterStore {
  subject = new BehaviorSubject<CompanyModel.Filter>(
    new CompanyModel.Filter({}),
  );
  store$ = this.subject.asObservable();

  set(filter: CompanyModel.Filter) {
    this.subject.next(filter);
  }

  get() {
    return this.subject.getValue();
  }
}
