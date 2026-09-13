// assets
import { IconReportMoney, IconUsers } from '@tabler/icons-react';

// constant
const icons = { IconReportMoney, IconUsers };

// ==============================|| REPORTS MENU ITEMS (ADMIN) ||============================== //

const finance = {
  id: 'finance',
  title: 'Reportes',
  type: 'group',
  children: [
    {
      id: 'finance-summary',
      title: 'Finanzas',
      type: 'item',
      url: '/finance',
      icon: icons.IconReportMoney,
      breadcrumbs: false
    },
    {
      id: 'technician-productivity',
      title: 'Productividad',
      type: 'item',
      url: '/productivity',
      icon: icons.IconUsers,
      breadcrumbs: false
    }
  ]
};

export default finance;
