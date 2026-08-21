import { Component, inject } from '@angular/core';

import { NavService } from '../../../@core/services/nav.service';
import { HeaderLogo } from './widgets/header-logo/header-logo';
import { Profile } from './widgets/profile/profile';
import { Search } from './widgets/search/search';
import { Mode } from './widgets/mode/mode';
import { ActiveCompanySwitcher } from './widgets/active-company-switcher/active-company-switcher';

@Component({
  selector: 'app-header',
  imports: [HeaderLogo, Search, Mode, Profile, ActiveCompanySwitcher],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private navService = inject(NavService);

  toggleLanguage() {
    this.navService.isLanguage = !this.navService.isLanguage;
  }

  clickOutside() {
    this.navService.isLanguage = false;
  }

  openSearch() {
    this.navService.isSearchOpen = true;
  }
}
