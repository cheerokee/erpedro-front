import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

import { FirstCommunionModel } from '../../../../@core/modules/parishioner/entities/first-communion.model';

@Injectable()
export class FilterStore {
  subject = new BehaviorSubject<FirstCommunionModel.Filter>(
    new FirstCommunionModel.Filter({}),
  );
  store$ = this.subject.asObservable();

  set(filter: FirstCommunionModel.Filter) {
    this.subject.next(filter);
  }

  get() {
    return this.subject.getValue();
  }
}
