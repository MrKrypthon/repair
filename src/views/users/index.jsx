import { useEffect, useState } from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const roleLabels = { ADMIN: 'Administrador', TECHNICIAN: 'Técnico', RECEPTIONIST: 'Recepción' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'TECHNICIAN' });

  const load = () => api.listUsers().then(setUsers).catch(() => setError('No se pudo cargar la lista de usuarios.'));
  useEffect(() => { load(); }, []);
  const create = (event) => { event.preventDefault(); api.createUser(form).then(() => { setOpen(false); setForm({ name: '', email: '', password: '', role: 'TECHNICIAN' }); return load(); }).catch(() => setError('No se pudo crear el usuario. Verifica que el correo no esté repetido.')); };

  return <Stack spacing={3}><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}><Box><Typography variant="h2">Usuarios y roles</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Administra el equipo que opera el taller.</Typography></Box><Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>Nuevo usuario</Button></Stack>{error && <Alert severity="warning">{error}</Alert>}<MainCard title="Usuarios activos"><Stack spacing={1.5}>{users.map((user) => <Stack direction="row" spacing={2} key={user.id} sx={{ alignItems: 'center', p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}><Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</Avatar><Box sx={{ flex: 1 }}><Typography fontWeight={600}>{user.name}</Typography><Typography variant="body2" color="text.secondary">{user.email}</Typography></Box><Chip label={roleLabels[user.role] || user.role} color={user.role === 'ADMIN' ? 'primary' : 'default'} icon={user.role === 'ADMIN' ? <AdminPanelSettingsRoundedIcon /> : undefined} /><Chip label={user.active ? 'Activo' : 'Inactivo'} color={user.active ? 'success' : 'default'} size="small" /></Stack>)}</Stack></MainCard><Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Nuevo usuario</DialogTitle><Stack component="form" onSubmit={create}><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField required fullWidth label="Nombre" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><TextField required fullWidth type="email" label="Correo" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><TextField required fullWidth type="password" label="Contraseña" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} inputProps={{ minLength: 8 }} /><TextField select fullWidth label="Rol" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><MenuItem value="ADMIN">Administrador</MenuItem><MenuItem value="TECHNICIAN">Técnico</MenuItem><MenuItem value="RECEPTIONIST">Recepción</MenuItem></TextField></Stack></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" variant="contained">Crear usuario</Button></DialogActions></Stack></Dialog></Stack>;
}
