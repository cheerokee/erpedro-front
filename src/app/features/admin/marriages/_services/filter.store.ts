import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

import { MarriageModel } from '../../../../@core/modules/parishioner/entities/marriage.model';

@Injectable()
export class FilterStore {
  subject = new BehaviorSubject<MarriageModel.Filter>(
    new MarriageModel.Filter({}),
  );
  store$ = this.subject.asObservable();

  set(filter: MarriageModel.Filter) {
    this.subject.next(filter);
  }

  get() {
    return this.subject.getValue();
  }
}
