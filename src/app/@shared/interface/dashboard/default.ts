import { SafeHtml } from '@angular/platform-browser';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexStroke,
  ApexXAxis,
  ApexGrid,
  ApexFill,
  ApexYAxis,
  ApexResponsive,
  ApexDataLabels,
  ApexLegend,
  ApexPlotOptions,
  ApexStates,
  ApexMarkers,
} from 'ng-apexcharts';

export interface IDetails {
  title: string;
  count: string;
  margin: string;
  margin_type: string;
  icon: string;
  color: string;
  class?: string;
}

export interface ITopCustomers {
  id: number;
  customer_name: SafeHtml;
  customer_profile: string;
  customer_id: string;
  purchase_items: number;
  total_price: number;
}

export interface IActivityLogs {
  id: number;
  title: string;
  description: string;
  log_type: string;
  log_details: string;
  date: string;
  time: string;
  color: string;
  image?: boolean;
  images?: IImages[];
}

export interface IImages {
  image_url: string;
}

export interface IRecentOrders {
  id: number;
  product_name: SafeHtml;
  product_image: string;
  product_id: string;
  customer_name: string;
  quantity: number;
  total_price: string;
  order_date: string;
  status: SafeHtml;
  status_color: string;
  category: string;
}

export interface IManageAppointments {
  id: number;
  appointment_title: string;
  appointment_time: string;
  appointment_description?: string;
  schedule_time?: string;
  color: string;
}

export interface IVisitorChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  colors: string[];
  stroke: ApexStroke;
  xaxis: ApexXAxis;
  grid: ApexGrid;
  fill: ApexFill;
  yaxis: ApexYAxis;
  responsive: ApexResponsive[];
}

export interface ISalesStatisticalChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  grid: ApexGrid;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  fill: ApexFill;
  legend: ApexLegend;
  states: ApexStates;
  colors: string[];
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  responsive: ApexResponsive[];
}

export interface IMonthlyTargetChart {
  series: number[];
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  grid: ApexGrid;
  fill: ApexFill;
  labels: string[];
  responsive: ApexResponsive[];
  description: string;
  targetDetails: ITargetDetails[];
}

export interface ITargetDetails {
  title: string;
  value: string;
  icon: string;
  badge_color: string;
}

export interface ISalesReportChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  stroke: ApexStroke;
  plotOptions: ApexPlotOptions;
  colors: string[];
  fill: ApexFill;
  grid: ApexGrid;
  legend: ApexLegend;
  markers: ApexMarkers;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  responsive: ApexResponsive[];
  chartMarker: ISalesReportChartMarker[];
}

export interface ISalesReportChartMarker {
  title: string;
  color: string;
}
