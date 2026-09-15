import { IconCalendarEvent } from '@tabler/icons-react';

const appointments = {
  id: 'appointments',
  title: 'Agenda',
  type: 'group',
  children: [{ id: 'appointments-list', title: 'Agenda y citas', type: 'item', url: '/appointments', icon: IconCalendarEvent }]
};

export default appointments;
