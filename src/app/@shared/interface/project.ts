import { SafeHtml } from '@angular/platform-browser';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexPlotOptions,
  ApexResponsive,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
} from 'ng-apexcharts';

import { IImages } from './dashboard/default';

export interface IProjectDetails {
  project_summary: IProjectSummary;
  project_status: IProjectStatus[];
  finance: IFinance;
  team: ITeam[];
  attachment: IAttachment;
  activity: IProjectActivity[];
}

export interface IProjectSummary {
  summary: ISummary;
  todo_list: ITodoList[];
  pending_project: IPendingProject[];
  task_overViewChart: ITaskOverViewChart;
  recent_activity: IRecentActivity;
  team_members: ITeamMembers[];
  comments: IComments[];
}

export interface ITaskOverViewChart {
  title: string;
  sort_description: string;
  series: ApexAxisChartSeries;
  chart: ApexChart;
  stroke: ApexStroke;
  xaxis: ApexXAxis;
  grid: ApexGrid;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  colors: string[];
  fill: ApexFill;
  markers: ApexMarkers;
  responsive: ApexResponsive[];
}

export interface ISummary {
  title: string;
  description: string;
  sort_description: string;
  creation_date: string;
  due_date: string;
  priority: string;
  status: string;
  resource: IResource;
  chart_details: IProjectSummaryChartDetails;
}
export interface IProjectSummaryChartDetails {
  series: number[];
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  colors: string[];
  labels: string[];
  legend: ApexLegend;
  responsive: ApexResponsive[];
}

export interface IResource {
  title: string;
  file_size: string;
  file_type: string;
  file: string;
}

export interface ITodoList {
  id: number;
  title: string;
  description: string;
}

export interface IPendingProject {
  id: number;
  project_name: string;
  project_head_name: string;
  project_head_email: string;
  project_head_profile: string;
  priority: string;
  due_date: string;
  status: SafeHtml;
  color: string;
}

export interface IRecentActivity {
  title: string;
  date: string;
  activities: IActivities[];
}

export interface IActivities {
  date: string;
  day: string;
  activity: IActivity[];
}

export interface IActivity {
  id: number;
  title: string;
  customer_name: string;
  time: string;
  created_time: string;
}

export interface ITeamMembers {
  id: number;
  name: string;
  email: string;
  image: string;
}

export interface IComments {
  id: number;
  name: string;
  message: string;
  image: string;
  is_reply?: boolean;
}

export interface IProjectStatus {
  id: number;
  project_title: string;
  project_description: string;
  project_banner?: string;
  tag: string;
  tag_color: string;
  date: string;
  attachment: number;
  comments: number;
  progress: number;
  status: string;
  developer: IProfile[];
}

export interface IProfile {
  name: string;
  profile?: string;
}

export interface IFinance {
  expenses: IExpenses[];
  budget_details: IBudgetDetails[];
  budget_distribution: IBudgetDistributionChart;
}
export interface IBudgetDistributionChart {
  series: number[];
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  colors: string[];
  labels: string[];
}
export interface IExpenses {
  id: number;
  title: string;
  value: string;
  profit: string;
  profit_type: string;
  chart_details: IExpensesChartDetails;
}

export interface IExpensesChartDetails {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  grid: ApexGrid;
  colors: string[];
  stroke?: ApexStroke;
  tooltip?: ApexTooltip;
  xaxis: ApexXAxis;
  fill?: ApexFill;
  yaxis: ApexYAxis;
  legend?: ApexLegend;
  responsive: ApexResponsive[];
  plotOptions?: ApexPlotOptions;
  dataLabels?: ApexDataLabels;
  markers?: ApexMarkers;
}

export interface IBudgetDetails {
  id: number;
  type: string;
  total_budget: number;
  expenses: number;
  remaining: number;
}

export interface ITeam {
  id: number;
  developer_name: string;
  position: string;
  profile: string;
  total_task: number;
  completed_task: number;
  revenue: number;
  projects: number;
  features: number;
  color: string;
}

export interface IAttachment {
  attachment_types: IAttachmentTypes[];
  attachments: IAttachments[];
}

export interface IAttachmentTypes {
  id: number;
  title: string;
  icon: string;
  color: string;
}

export interface IAttachments {
  id: number;
  file_name: string;
  upload_time: string;
  file_icon: string;
  total_file_size: number;
  upload_size: number;
}

export interface IProjectActivity {
  title: string;
  description?: string;
  time: string;
  added_by: IAddedBy;
  color: string;
  attachments?: IActivityAttachment[];
  images?: IImages[];
  members?: IProfile[];
  templates?: IActivityTemplate[];
}

export interface IAddedBy {
  name: string;
  profile: string;
}

export interface IActivityAttachment {
  file_name: string;
  file_icon: string;
  file_size: string;
}

export interface IActivityTemplate {
  id: number;
  project_name: string;
  task: string;
  assign_to: IProfile[];
  status: string;
  color: string;
  due_date: string;
}

export interface IProjects {
  id: number;
  project_name: string;
  project_description: string;
  project_banner: string;
  date: string;
  progress: number;
  status: string;
  budget: string;
  team_member: IProfile[];
}

export interface IProjectCostPerformance {
  title: string;
  total_budget: number;
  actual_cost: number;
  labels: string[];
  series: number[];
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  grid: ApexGrid;
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  colors: string[];
  responsive: ApexResponsive[];
}
