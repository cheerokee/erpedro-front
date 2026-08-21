import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

import { BaptismModel } from '../../../../@core/modules/parishioner/entities/baptism.model';

@Injectable()
export class FilterStore {
  subject = new BehaviorSubject<BaptismModel.Filter>(
    new BaptismModel.Filter({}),
  );
  store$ = this.subject.asObservable();

  set(filter: BaptismModel.Filter) {
    this.subject.next(filter);
  }

  get() {
    return this.subject.getValue();
  }
}
