import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function NotificationList({ notifications, onRead }) {
  if (!notifications.length) return <Typography color="text.secondary" sx={{ p: 3 }}>No hay notificaciones.</Typography>;

  return <List sx={{ width: '100%', maxWidth: { xs: 300, md: 330 }, py: 0 }}>{notifications.map((notification) => <ListItemButton key={notification.id} onClick={() => !notification.read && onRead(notification.id)} sx={{ display: 'block', borderBottom: '1px solid', borderColor: 'divider', p: 2 }}><Typography variant="subtitle1" fontWeight={notification.read ? 400 : 700}>{notification.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{notification.message}</Typography><Stack direction="row" spacing={1} sx={{ mt: 1 }}><Chip label={notification.read ? 'Leída' : 'Nueva'} size="small" color={notification.read ? 'default' : 'warning'} /><Box component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem', alignSelf: 'center' }}>{new Date(notification.createdAt).toLocaleString('es-MX')}</Box></Stack></ListItemButton>)}</List>;
}

NotificationList.propTypes = { notifications: PropTypes.array, onRead: PropTypes.func };
