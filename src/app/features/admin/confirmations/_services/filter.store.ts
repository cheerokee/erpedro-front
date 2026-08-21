import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

import { ConfirmationModel } from '../../../../@core/modules/parishioner/entities/confirmation.model';

@Injectable()
export class FilterStore {
  subject = new BehaviorSubject<ConfirmationModel.Filter>(
    new ConfirmationModel.Filter({}),
  );
  store$ = this.subject.asObservable();

  set(filter: ConfirmationModel.Filter) {
    this.subject.next(filter);
  }

  get() {
    return this.subject.getValue();
  }
}
