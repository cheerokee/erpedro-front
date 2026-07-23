import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

import { FinancialServiceModel } from '../../../../@core/modules/financial/entities/financial-service.model';

@Injectable()
export class FilterStore {
  subject = new BehaviorSubject<FinancialServiceModel.Filter>(
    new FinancialServiceModel.Filter({}),
  );
  store$ = this.subject.asObservable();

  set(filter: FinancialServiceModel.Filter) {
    this.subject.next(filter);
  }

  get() {
    return this.subject.getValue();
  }
}
