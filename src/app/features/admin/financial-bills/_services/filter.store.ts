import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

import { FinancialBillModel } from '../../../../@core/modules/financial/entities/financial-bill.model';

@Injectable()
export class FilterStore {
  subject = new BehaviorSubject<FinancialBillModel.Filter>(
    new FinancialBillModel.Filter({}),
  );
  store$ = this.subject.asObservable();

  set(filter: FinancialBillModel.Filter) {
    this.subject.next(filter);
  }

  get() {
    return this.subject.getValue();
  }
}
