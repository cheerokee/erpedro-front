export interface INumberingWizardTabs {
  id: number;
  title: string;
  value: string;
  class: string;
}

export interface IVerticalValidation {
  id: number;
  title: string;
  value: string;
  text: string;
  class: string;
}

export interface ICartInfo {
  id: string;
  title: string;
  checked: boolean;
}

export interface INetBanking {
  row: number;
  details: IDetailsNetBanking[];
}

export interface IDetailsNetBanking {
  id: string;
  title: string;
  checked: boolean;
}

export interface IShippingForm {
  id: number;
  title: string;
  value: string;
  icon: string;
}

export interface IProductDetails {
  image: string;
  alt: string;
  title: string;
  quantity: string;
  price: number;
}

export interface IProductTotal {
  title: string;
  price: string;
}
