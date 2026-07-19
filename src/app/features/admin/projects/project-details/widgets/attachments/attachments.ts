import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Card } from '../../../../../../@shared/components/ui/card/card';
import { SvgIcon } from '../../../../../../@shared/components/ui/svg-icon/svg-icon';
import { projectDetails } from '../../../../../../@shared/data/project';

@Component({
  selector: 'app-attachments',
  imports: [RouterModule, Card, SvgIcon],
  templateUrl: './attachments.html',
  styleUrl: './attachments.scss',
})
export class Attachments {
  public attachmentType = projectDetails.attachment.attachment_types;
  public attachments = projectDetails.attachment.attachments;
}
