import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Apollo } from 'apollo-angular';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgApexchartsModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, NgApexchartsModule],
  providers: [Apollo],
})
export class SharedModule {}
