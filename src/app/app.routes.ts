import { Routes } from "@angular/router";

import { content } from "./shared/routes/content.routes";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/pages/sample-page1",
    pathMatch: "full",
  },
  {
    path: "",
    loadComponent: () =>
      import("./shared/components/layout/content/content").then(
        (m) => m.Content,
      ),
    children: content,
  },
  {
    path: "**",
    redirectTo: "",
  },
];
