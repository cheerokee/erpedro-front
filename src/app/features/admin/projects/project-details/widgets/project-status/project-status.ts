import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { CardDropdownButton } from '../../../../../../@shared/components/ui/card/card-dropdown-button/card-dropdown-button';
import { FeatherIcon } from '../../../../../../@shared/components/ui/feather-icon/feather-icon';
import { SvgIcon } from '../../../../../../@shared/components/ui/svg-icon/svg-icon';
import {
  projectDetails,
  projectStatus,
  projectStatusOptions,
} from '../../../../../../@shared/data/project';
import { ChatService } from '../../../../../../@shared/services/chat.service';

@Component({
  selector: 'app-project-status',
  imports: [
    NgbTooltipModule,
    FeatherIcon,
    CardDropdownButton,
    SvgIcon,
    NgClass,
  ],
  templateUrl: './project-status.html',
  styleUrl: './project-status.scss',
})
export class ProjectStatus {
  chatService = inject(ChatService);

  public projectStatus = projectStatus;
  public projectStatusOptions = projectStatusOptions;
  public projects = projectDetails.project_status;
}
