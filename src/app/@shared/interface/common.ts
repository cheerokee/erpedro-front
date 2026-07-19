export interface ICardToggleOptions {
  id: number;
  title: string;
}

export interface ITableConfigs<T = unknown> {
  columns: ITableColumn[];
  row_action?: IHasId[];
  data: T[];
}

export interface ITableColumn {
  title: string;
  field_value: string;
  sortable_key?: string;
  sort?: boolean;
  type?: string;
  template?: string;
  class?: string;
  decimal_number?: boolean;
  text?: string;
  icon_field?: string;
  hide_column?: boolean;
}

export interface ITableClickedAction<TData = unknown, TValue = unknown> {
  action_to_perform?: string;
  data?: TData;
  value?: TValue;
}

export interface IColumnColors {
  [key: string]: string;
}
export interface IPagination {
  total_items: number;
  current_page: number;
  page_size: number;
  total_pages: number;
  start_page: number;
  end_page?: number;
  start_index: number;
  end_index: number;
  pages: number[];
}

export interface ITabs {
  id: number;
  title: string;
  value: string;
  icon?: string;
}

export interface IPageSizeOptions {
  title: number;
  value: number;
  selected?: boolean;
}
export interface IHasId {
  id?: number;
  is_checked?: boolean;
  date?: string | Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface IGoogleMapMarkers {
  position: IMarkerPosition;
  label: IMarkerLabel;
}

export interface IMarkerPosition {
  lat: number;
  lng: number;
}

export interface IMarkerLabel {
  color: string;
  text: string;
}

declare global {
  export interface Window {
    navigate: () => void;
  }
}

declare global {
  interface Window {
    copyKey: (key: string) => void;
  }
}
