import { Component } from '@angular/core';

import { FeatherIcon } from '../../../../../../../../@shared/components/ui/feather-icon/feather-icon';
import { projectRating } from '../../../../../../../../@shared/data/project';

@Component({
  selector: 'app-project-rating',
  imports: [FeatherIcon],
  templateUrl: './project-rating.html',
  styleUrl: './project-rating.scss',
})
export class ProjectRating {
  public projectRating = projectRating;
}
