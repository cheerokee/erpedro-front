import { Component, inject } from "@angular/core";
import { Router, RouterModule } from "@angular/router";

import { profile } from "../../../../data/header";
import { FeatherIcon } from "../../../ui/feather-icon/feather-icon";

@Component({
  selector: "app-profile",
  imports: [RouterModule, FeatherIcon],
  templateUrl: "./profile.html",
  styleUrl: "./profile.scss",
})
export class Profile {
  private router = inject(Router);

  public profile = profile;
}
