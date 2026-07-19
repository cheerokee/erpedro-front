import { TitleCasePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { SvgIcon } from '../../../../../../../../@shared/components/ui/svg-icon/svg-icon';
import { IProjects } from '../../../../../../../../@shared/interface/project';
import { ChatService } from '../../../../../../../../@shared/services/chat.service';

@Component({
  selector: 'app-project-details',
  imports: [NgbTooltipModule, SvgIcon, TitleCasePipe],
  templateUrl: './project-details.html',
  styleUrl: './project-details.scss',
})
export class ProjectDetails {
  chatService = inject(ChatService);
  readonly project = input<IProjects>();
}
