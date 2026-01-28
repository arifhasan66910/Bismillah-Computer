
import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  BarChart3, 
  Users,
  Camera,
  FileText,
  PenTool,
  Copy,
  ShoppingBag,
  Lightbulb,
  UserCheck,
  Home,
  MoreHorizontal
} from 'lucide-react';
import { ServiceCategory } from './types';

export const CATEGORY_LABELS: Record<string, string> = {
  'Photocopy': 'ফটোকপি',
  'Stationery': 'স্টেশনারি',
  'Photography': 'ফটোগ্রাফি',
  'Online Form': 'অনলাইন ফরম',
  'Stamp/Seal': 'স্ট্যাম্প/সিল',
  'Rent': 'দোকান ভাড়া',
  'Electricity': 'বিদ্যুৎ বিল',
  'Salary': 'বেতন',
  'Others': 'অন্যান্য',
};

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Photocopy': <Copy className="w-5 h-5" />,
  'Stationery': <ShoppingBag className="w-5 h-5" />,
  'Photography': <Camera className="w-5 h-5" />,
  'Online Form': <FileText className="w-5 h-5" />,
  'Stamp/Seal': <PenTool className="w-5 h-5" />,
  'Rent': <Home className="w-5 h-5" />,
  'Electricity': <Lightbulb className="w-5 h-5" />,
  'Salary': <UserCheck className="w-5 h-5" />,
  'Others': <MoreHorizontal className="w-5 h-5" />,
};

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'accounting', label: 'লেনদেন (আয়/ব্যয়)', icon: <Wallet className="w-5 h-5" /> },
  { id: 'customers', label: 'কাস্টমার', icon: <Users className="w-5 h-5" /> },
  { id: 'reports', label: 'হিসাব-নিকাশ', icon: <BarChart3 className="w-5 h-5" /> },
];

export const AUTH_CREDENTIALS = {
  username: 'admin',
  password: '123'
};
