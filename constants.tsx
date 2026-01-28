
import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  BarChart3, 
  Users,
  Camera,
  FileText,
  PenTool,
  Copy,
  ShoppingBag
} from 'lucide-react';
import { ServiceCategory } from './types';

export const CATEGORY_ICONS: Record<ServiceCategory, React.ReactNode> = {
  [ServiceCategory.PHOTOCOPY]: <Copy className="w-5 h-5" />,
  [ServiceCategory.STATIONERY]: <ShoppingBag className="w-5 h-5" />,
  [ServiceCategory.PHOTOGRAPHY]: <Camera className="w-5 h-5" />,
  [ServiceCategory.ONLINE_FORM]: <FileText className="w-5 h-5" />,
  [ServiceCategory.STAMP_SEAL]: <PenTool className="w-5 h-5" />,
};

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'sales', label: 'Sales Entry', icon: <PlusCircle className="w-5 h-5" /> },
  { id: 'customers', label: 'Customers', icon: <Users className="w-5 h-5" /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" /> },
];

export const AUTH_CREDENTIALS = {
  username: 'admin',
  password: '123'
};
