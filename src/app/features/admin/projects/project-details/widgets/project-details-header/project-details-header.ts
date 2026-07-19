import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SvgIcon } from '../../../../../../@shared/components/ui/svg-icon/svg-icon';
import { projectDetailsHeader } from '../../../../../../@shared/data/project';
import { ChatService } from '../../../../../../@shared/services/chat.service';

@Component({
  selector: 'app-project-details-header',
  imports: [RouterModule, SvgIcon],
  templateUrl: './project-details-header.html',
  styleUrl: './project-details-header.scss',
})
export class ProjectDetailsHeader {
  chatService = inject(ChatService);

  public projectDetailsHeader = projectDetailsHeader;
}
