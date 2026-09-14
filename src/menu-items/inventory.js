import { IconPackages, IconTools } from '@tabler/icons-react';

const inventory = {
  id: 'inventory',
  title: 'Inventario',
  type: 'group',
  children: [
    { id: 'inventory-list', title: 'Piezas y consumibles', type: 'item', url: '/inventory', icon: IconPackages },
    { id: 'service-catalog', title: 'Servicios y mano de obra', type: 'item', url: '/service-catalog', icon: IconTools }
  ]
};

export default inventory;
