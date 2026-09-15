import { IconUsers } from '@tabler/icons-react';

const users = {
  id: 'users',
  title: 'Administración',
  type: 'group',
  children: [{ id: 'users-list', title: 'Usuarios y roles', type: 'item', url: '/users', icon: IconUsers }]
};

export default users;
