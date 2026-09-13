import { IconAddressBook, IconClipboardText, IconCalendarPlus, IconFileInvoice } from '@tabler/icons-react';

const operations = {
  id: 'operations',
  title: 'Operación',
  type: 'group',
  children: [
    { id: 'customers', title: 'Clientes', type: 'item', url: '/customers', icon: IconAddressBook },
    { id: 'quotations', title: 'Cotizaciones', type: 'item', url: '/quotations', icon: IconFileInvoice },
    { id: 'service-orders', title: 'Órdenes de servicio', type: 'item', url: '/service-orders', icon: IconClipboardText },
    { id: 'new-service-order', title: 'Nueva orden', type: 'item', url: '/service-orders/new', icon: IconCalendarPlus }
  ]
};

export default operations;
