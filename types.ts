
export enum ServiceCategory {
  PHOTOCOPY = 'Photocopy',
  STATIONERY = 'Stationery',
  PHOTOGRAPHY = 'Photography',
  ONLINE_FORM = 'Online Form',
  STAMP_SEAL = 'Stamp/Seal',
  RENT = 'Rent',
  ELECTRICITY = 'Electricity',
  SALARY = 'Salary',
  OTHERS = 'Others'
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  service_name?: string;
  amount: number;
  description?: string;
  timestamp: string;
  customer_phone?: string;
  created_by?: string;
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

export type ViewType = 'dashboard' | 'accounting' | 'reports' | 'customers';
export type ReportPeriod = 'daily' | 'monthly' | 'yearly';
