import { Component } from '@angular/core';

import { Card } from '../../../../../../../../@shared/components/ui/card/card';
import { SvgIcon } from '../../../../../../../../@shared/components/ui/svg-icon/svg-icon';
import { projectDetails } from '../../../../../../../../@shared/data/project';

@Component({
  selector: 'app-comments',
  imports: [Card, SvgIcon],
  templateUrl: './comments.html',
  styleUrl: './comments.scss',
})
export class Comments {
  public comments = projectDetails.project_summary.comments;
}
