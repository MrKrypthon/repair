// assets
import { IconBrandChrome } from '@tabler/icons-react';

// constant
const icons = { IconBrandChrome };

// ==============================|| SAMPLE PAGE MENU ITEMS ||============================== //

const other = {
  id: 'sample-docs-roadmap',
  type: 'group',
  children: [
    {
      id: 'sample-page',
      title: 'Sample Page',
      type: 'item',
      url: '/sample-page',
      icon: icons.IconBrandChrome,
      breadcrumbs: false
    }
  ]
};

export default other;
