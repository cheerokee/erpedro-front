import { SafeHtml } from '@angular/platform-browser';

export interface IProducts {
  product: IProduct[];
}

export interface IProduct {
  id: number;
  image: string;
  product_name: SafeHtml;
  sort_description: string;
  description: string;
  discount_price: number;
  price: SafeHtml;
  discount?: number;
  tag?: string;
  stock: string;
  review: number;
  category: string;
  rating: SafeHtml;
  colors: string[];
  size: string[];
  tags: string[];
  sku: string;
  qty: SafeHtml;
}
