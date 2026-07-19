export interface IBasicTable {
  id: number;
  first_name: string;
  last_name: string;
  user_name: string;
  designation: string;
  company: string;
  language: string;
  country: string;
  class: string;
  tr_class: string;
  image_url: string;
}

export interface IStudent {
  id: string;
  roll_number: string;
  student_name: string;
  standard: string;
  grade: string;
  percentage: string;
  class?: string;
}

export interface IInverseTable {
  id: number;
  first_name: string;
  last_name: string;
  office: string;
  position: string;
  salary: string;
  join_date: string;
  age: number;
}

export interface IHoverAbleTable {
  id: number;
  status: string;
  class: string;
  signal_name: string;
  security: string;
  stage: string;
  schedule: number;
  team_lead: string;
}

export interface IInverseTableBackground {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
  credit_volume: string;
  user_name: string;
  role: string;
  country: string;
}

export interface ICaption {
  id: number;
  employee_name: string;
  email: string;
  experience: string;
  sex: string;
  contact_number: string;
  age: number;
}

export interface ITableHeadOption {
  id: number;
  first_name: string;
  last_name: string;
  user_name: string;
}

export interface IStripedRow {
  id: number;
  dessert: string;
  calories: number;
  fat: number;
  price: number;
}

export interface IStripedColumn {
  id: number;
  name: string;
  age: number;
  city: string;
  occupation: string;
}

export interface IActiveTable {
  product_id: string;
  product_name: string;
  category: string;
  price: string;
}

export interface ITableBorder {
  isbn: string;
  title: string;
  author: string;
  year_published: number;
}

export interface ITableWithoutBorder {
  date: string;
  exercise_type: string;
  duration: number;
  calories_burned: number;
}

export interface IVerticalAlignment {
  heading1: string;
  heading2: string;
  heading3: string;
  heading4: string;
}

export interface IAnatomyTable {
  version: string;
  class: string;
  release_date: string;
  new_features: string;
  bug_fixes: string;
}

export interface ITableFoot {
  product_id: string;
  product_name: string;
  category: string;
  price: string;
}

export interface ITableGroupDivider {
  id: number;
  first_name: string;
  last_name?: string;
  handle: string;
}

export interface IBreakpointTable {
  id: number;
  name: string;
  order_id: string;
  price: number;
  quantity: number;
  total: string;
}

export interface IResponsiveTable {
  id: number;
  task: string;
  email: string;
  phone: string;
  assign: string;
  date: string;
  price: number;
  status: string;
  progress: string;
  class: string;
}

export interface ISizingTable {
  id: number;
  employee_name: string;
  date: string;
  status: string;
  hours: number;
  performance: string;
  class: string;
}

export interface ICustomTable {
  id: number;
  film_title: string;
  released: number;
  studio: string;
  budget: string;
  domestic_gross: string;
}

export interface IDashedBorderTable {
  id: number;
  class_name: string;
  type: string;
  hours: string;
  trainer: string;
  spots: number;
}
