
export type TransactionType = 'income' | 'expense';
export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string;
}

export enum ServiceCategory {
  Photocopy = 'Photocopy',
  Stationery = 'Stationery',
  Photography = 'Photography',
  OnlineForm = 'Online Form',
  StampSeal = 'Stamp/Seal',
  Rent = 'Rent',
  Electricity = 'Electricity',
  Salary = 'Salary',
  Others = 'Others'
}

export interface Category {
  id?: string;
  name: string;
  label: string;
  type: TransactionType;
}

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

export interface Product {
  id?: string;
  name: string;
  name_bn?: string;
  category: string;
  purchase_price: number;
  sale_price_min: number;
  sale_price_max: number;
  current_stock: number;
  min_stock: number;
}

export interface InventoryLog {
  id?: string;
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  unit_price: number;
  total_price: number;
  timestamp: string;
  product_name?: string;
  product_name_bn?: string;
}

export interface Customer {
  id?: string;
  name: string;
  name_bn: string;
  phone: string;
  email?: string;
  nid: string;
  dob?: string;
  gender?: string;
  religion?: string;
  blood_group?: string;
  marital_status?: string;
  spouse_name?: string;
  father_name: string;
  father_name_bn: string;
  mother_name: string;
  mother_name_bn: string;
  address: string;
  height?: string;
  weight?: string;
  chest?: string;
  photo_url?: string;
  signature_url?: string;
  edu1_roll?: string;
  edu1_reg?: string;
  edu1_result?: string;
  edu1_group?: string;
  edu1_board?: string;
  edu1_year?: string;
  edu1_inst?: string;
  edu2_roll?: string;
  edu2_reg?: string;
  edu2_result?: string;
  edu2_group?: string;
  edu2_board?: string;
  edu2_year?: string;
  edu2_inst?: string;
  edu3_subject?: string;
  edu3_result?: string;
  edu3_year?: string;
  edu3_uni?: string;
  edu3_inst?: string;
  edu3_duration?: string;
  edu4_subject?: string;
  edu4_result?: string;
  edu4_year?: string;
  edu4_uni?: string;
  edu4_duration?: string;
  created_at?: string;
}

export type ViewType = 'dashboard' | 'accounting' | 'reports' | 'customers' | 'form_filling' | 'inventory';
export type ReportPeriod = 'daily' | 'monthly' | 'yearly';
