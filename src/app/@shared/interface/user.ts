import { SafeHtml } from '@angular/platform-browser';

export interface IUser {
  name: string;
  user_profile: string;
  user_email: string;
  addresses: IAddress[];
}

export interface IAddress {
  id: number;
  address: string;
  pin_code: string;
  contact: string;
  tag?: string;
}

export interface IUsers {
  id: string | number;
  user_name: string;
  name: SafeHtml;
  user_profile: string;
  designation: string;
  bio: string;
  email: string;
  DOB: string;
  contact_number: string;
  location: string;
  post: number;
  followers: number;
  following: number;
  role: string;
  status: string;
  creation_date: string;
}

export interface INotification {
  id: number;
  user_profile: string;
  title: string;
  description: string;
  time?: string;
  date: string;
}

export interface IRole {
  id: number;
  role: string;
  creation_date: string;
  last_update_date: string;
  status: string;
}

export interface IModule {
  id: number;
  name: string;
  is_checked: boolean;
  module_permission: IPermission[];
}

export interface IPermission {
  id: number;
  is_checked: boolean;
  permission_id: number;
  name: string;
}
