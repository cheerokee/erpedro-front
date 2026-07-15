
import { Component } from "@angular/core";

import { SamplePage1 } from "../pages/sample-page1/sample-page1";

@Component({
  selector: "app-sample-page",
  standalone: true,
  imports: [SamplePage1],
  templateUrl: "./sample-page.html",
  styleUrl: "./sample-page.scss",
})
export class SamplePage {}
