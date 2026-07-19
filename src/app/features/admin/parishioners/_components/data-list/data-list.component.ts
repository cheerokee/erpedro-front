import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { SharedModule } from '../../../../../@shared/shared.module';
import { Card } from '../../../../../@shared/components/ui/card/card';
import { basicTable } from '../../../../../@shared/data/bootstrap-table';
import { FilterComponent } from '../filter/filter.component';
import { CompanySelectorComponent } from '../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { getAuthenticatedUser } from '../../../../../@core/utils/get-authenticated-user.helper';

@Component({
  selector: 'app-data-list-parishioners',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [SharedModule, Card, FilterComponent, CompanySelectorComponent],
})
export class DataListComponent implements AfterViewInit {
  public basicTable = basicTable;

  @ViewChild('companySelector') companySelector: CompanySelectorComponent;

  ngAfterViewInit() {
    const authenticatedUser = getAuthenticatedUser();

    if (this.companySelector && authenticatedUser.companies?.length > 0) {
      console.log(authenticatedUser.companies[0].id);

      this.companySelector.autoset(authenticatedUser.companies[0].id);
    }
  }
}
