// assets
import { IconReportMoney } from '@tabler/icons-react';

// constant
const icons = { IconReportMoney };

// ==============================|| FINANCE MENU ITEMS ||============================== //

const finance = {
  id: 'finance',
  title: 'Finanzas',
  type: 'group',
  children: [
    {
      id: 'finance-summary',
      title: 'Finanzas',
      type: 'item',
      url: '/finance',
      icon: icons.IconReportMoney,
      breadcrumbs: false
    }
  ]
};

export default finance;
