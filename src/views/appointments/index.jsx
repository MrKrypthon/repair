import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const demoAppointments = [
  { id: 'a1', title: 'Entrega iPhone 12 · OS-1048', type: 'DELIVERY', startsAt: '2026-09-07T10:00:00', endsAt: '2026-09-07T10:30:00', status: 'SCHEDULED' },
  { id: 'a2', title: 'Recepción MacBook Air', type: 'RECEIVING', startsAt: '2026-09-07T12:00:00', endsAt: '2026-09-07T12:30:00', status: 'SCHEDULED' },
  { id: 'a3', title: 'Diagnóstico Nintendo Switch', type: 'WORK', startsAt: '2026-09-08T09:00:00', endsAt: '2026-09-08T10:30:00', status: 'SCHEDULED' }
];

const typeLabel = { RECEIVING: 'Recepción', DELIVERY: 'Entrega', APPOINTMENT: 'Cita', WORK: 'Trabajo' };

export default function Appointments() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'APPOINTMENT', startsAt: '', endsAt: '', notes: '' });
  const [customers, setCustomers] = useState([]);
  const [searchParams] = useSearchParams();

  const loadEvents = () => api.listAppointments().then(setEvents).catch(() => setError('No se pudo conectar con la API. Mostrando agenda de ejemplo.')).finally(() => setLoading(false));
  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { api.listCustomers().then(setCustomers).catch(() => {}); }, []);

  const source = events.length ? events : demoAppointments;
  const createEvent = (event) => { event.preventDefault(); api.createAppointment(form).then(() => { setSaved(true); setForm({ title: '', type: 'APPOINTMENT', startsAt: '', endsAt: '', notes: '', customerId: '' }); return loadEvents(); }).catch(() => setError('No se pudo crear el evento.')); };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}><Box><Typography variant="h2">Agenda</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Recepciones, entregas, citas y trabajos programados.</Typography></Box><Button variant="contained" startIcon={<AddRoundedIcon />} href="#new-event">Nuevo evento</Button></Stack>
      {error && <Alert severity="warning">{error}</Alert>}{saved && <Alert severity="success">Evento creado correctamente.</Alert>}
      <Grid container spacing={3}><Grid size={{ xs: 12, lg: 7 }}><MainCard title="Próximos eventos"><Stack spacing={2}>{loading ? <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box> : source.map((item) => <Stack direction="row" spacing={2} key={item.id} sx={{ alignItems: 'center' }}><Box sx={{ minWidth: 64, textAlign: 'center', p: 1, borderRadius: 2, bgcolor: 'primary.lighter' }}><Typography variant="h4">{new Date(item.startsAt).toLocaleDateString('es-MX', { day: '2-digit' })}</Typography><Typography variant="caption">{new Date(item.startsAt).toLocaleDateString('es-MX', { month: 'short' })}</Typography></Box><Box sx={{ flex: 1 }}><Typography fontWeight={600}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{new Date(item.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} - {new Date(item.endsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</Typography></Box><Chip label={typeLabel[item.type] || item.type} size="small" variant="outlined" /></Stack>)}</Stack></MainCard></Grid><Grid size={{ xs: 12, lg: 5 }}><MainCard title="Crear evento" id="new-event"><Stack component="form" spacing={2} onSubmit={createEvent}><TextField required fullWidth label="Título" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Entrega iPhone 12" /><TextField select fullWidth label="Tipo" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><MenuItem value="RECEIVING">Recepción</MenuItem><MenuItem value="DELIVERY">Entrega</MenuItem><MenuItem value="APPOINTMENT">Cita</MenuItem><MenuItem value="WORK">Trabajo</MenuItem></TextField><TextField select fullWidth label="Cliente (opcional)" value={form.customerId || searchParams.get('customerId') || ''} onChange={(event) => setForm({ ...form, customerId: event.target.value })}><MenuItem value="">Sin asociar</MenuItem>{customers.map((customer) => <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>)}</TextField><TextField required fullWidth type="datetime-local" label="Inicio" InputLabelProps={{ shrink: true }} value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /><TextField required fullWidth type="datetime-local" label="Fin" InputLabelProps={{ shrink: true }} value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /><TextField fullWidth multiline minRows={2} label="Notas" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /><Divider /><Button type="submit" variant="contained" startIcon={<EventAvailableRoundedIcon />}>Guardar evento</Button></Stack></MainCard></Grid></Grid>
    </Stack>
  );
}
