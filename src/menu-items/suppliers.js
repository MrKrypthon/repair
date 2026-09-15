import { IconTruckDelivery } from '@tabler/icons-react';

const suppliers = {
  id: 'suppliers',
  title: 'Abastecimiento',
  type: 'group',
  children: [{ id: 'suppliers-list', title: 'Proveedores', type: 'item', url: '/suppliers', icon: IconTruckDelivery }]
};

export default suppliers;
