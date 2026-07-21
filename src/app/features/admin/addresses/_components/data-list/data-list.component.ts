import { AfterViewInit, Component, ViewChild } from '@angular/core';

import { getAuthenticatedUser } from '../../../../../@core/utils/get-authenticated-user.helper';
import { basicTable } from '../../../../../@shared/data/bootstrap-table';
import { Card } from '../../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterComponent } from '../filter/filter.component';
import { ModalAddressesComponent } from '../modal/modal.component';

@Component({
  selector: 'app-data-list-addresses',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [SharedModule, Card, FilterComponent, ModalAddressesComponent],
})
export class DataListComponent implements AfterViewInit {
  public basicTable = basicTable;

  @ViewChild('modal') modal: ModalAddressesComponent;

  ngAfterViewInit() {
    const authenticatedUser = getAuthenticatedUser();
  }

  new() {
    this.modal.show();
  }
}
