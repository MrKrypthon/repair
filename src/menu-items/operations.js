import { IconAddressBook, IconClipboardText, IconCalendarPlus } from '@tabler/icons-react';

const operations = {
  id: 'operations',
  title: 'Operación',
  type: 'group',
  children: [
    { id: 'customers', title: 'Clientes', type: 'item', url: '/customers', icon: IconAddressBook },
    { id: 'service-orders', title: 'Órdenes de servicio', type: 'item', url: '/service-orders', icon: IconClipboardText },
    { id: 'new-service-order', title: 'Nueva orden', type: 'item', url: '/service-orders/new', icon: IconCalendarPlus }
  ]
};

export default operations;
