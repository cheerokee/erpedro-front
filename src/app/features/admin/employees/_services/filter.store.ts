import { BehaviorSubject } from 'rxjs';
import { EmployeeModel } from '../../../../@core/modules/general/entities/employee.model';
import { Injectable } from '@angular/core';

@Injectable()
export class FilterStore {
  subject = new BehaviorSubject<EmployeeModel.Filter>(
    new EmployeeModel.Filter({}),
  );
  store$ = this.subject.asObservable();

  set(filter: EmployeeModel.Filter) {
    this.subject.next(filter);
  }

  get() {
    return this.subject.getValue();
  }
}
