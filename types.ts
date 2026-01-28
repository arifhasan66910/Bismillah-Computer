
export enum ServiceCategory {
  PHOTOCOPY = 'Photocopy',
  STATIONERY = 'Stationery',
  PHOTOGRAPHY = 'Photography',
  ONLINE_FORM = 'Online Form',
  STAMP_SEAL = 'Stamp/Seal'
}

export interface SaleRecord {
  id: string;
  category: ServiceCategory;
  amount: number;
  timestamp: string; // ISO string
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  nid: string;
  father_name: string;
  mother_name: string;
  address: string;
  created_at?: string;
}

export type ViewType = 'dashboard' | 'sales' | 'reports' | 'customers';
export type ReportPeriod = 'daily' | 'monthly' | 'yearly';
