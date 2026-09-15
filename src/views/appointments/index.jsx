import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const typeLabel = { RECEIVING: 'Recepción', DELIVERY: 'Entrega', APPOINTMENT: 'Cita', WORK: 'Trabajo' };
const statusLabel = { SCHEDULED: 'Programado', COMPLETED: 'Completado', CANCELLED: 'Cancelado' };

export default function Appointments() {
  const theme = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'APPOINTMENT', startsAt: '', endsAt: '', notes: '', customerId: '' });
  const [customers, setCustomers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [searchParams] = useSearchParams();

  const typeColors = {
    RECEIVING: theme.palette.primary.main,
    DELIVERY: theme.palette.success.main,
    APPOINTMENT: theme.palette.secondary.main,
    WORK: theme.palette.warning.main
  };

  const loadEvents = () => api.listAppointments().then(setEvents).catch(() => setError('No se pudo conectar con la API. Mostrando agenda de ejemplo.')).finally(() => setLoading(false));
  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { api.listCustomers().then(setCustomers).catch(() => {}); }, []);

  const suggestedTitle = (type, customerId) => {
    const customer = customers.find((item) => item.id === customerId);
    return customer ? `${typeLabel[type]} · ${customer.name}` : typeLabel[type];
  };
  const applyType = (type) => setForm((current) => ({ ...current, type, ...(current.title === '' || current.title === suggestedTitle(current.type, current.customerId) ? { title: suggestedTitle(type, current.customerId) } : {}) }));
  const applyCustomer = (customerId) => setForm((current) => ({ ...current, customerId, ...(current.title === '' || current.title === suggestedTitle(current.type, current.customerId) ? { title: suggestedTitle(current.type, customerId) } : {}) }));

  const createEvent = (event) => {
    event.preventDefault();
    api.createAppointment(form).then(() => { setSaved(true); setForm({ title: '', type: 'APPOINTMENT', startsAt: '', endsAt: '', notes: '', customerId: '' }); return loadEvents(); }).catch(() => setError('No se pudo crear el evento.'));
  };

  const handleDateSelect = (selection) => {
    const toLocalInput = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm({ ...form, startsAt: toLocalInput(selection.start), endsAt: toLocalInput(selection.end) });
    selection.view.calendar.unselect();
    document.getElementById('new-event')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleEventClick = (info) => {
    const appointment = events.find((item) => item.id === info.event.id);
    if (appointment) setSelectedEvent(appointment);
  };

  const changeStatus = (status) => {
    setUpdatingStatus(true);
    api.updateAppointmentStatus(selectedEvent.id, status).then(() => { setSelectedEvent(null); return loadEvents(); }).catch(() => setError('No se pudo actualizar el evento.')).finally(() => setUpdatingStatus(false));
  };

  const calendarEvents = events.map((item) => ({
    id: item.id,
    title: item.title,
    start: item.startsAt,
    end: item.endsAt,
    backgroundColor: typeColors[item.type],
    borderColor: typeColors[item.type],
    classNames: item.status === 'CANCELLED' ? ['fc-event-cancelled'] : []
  }));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2">Agenda</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>Recepciones, entregas, citas y trabajos programados.</Typography>
      </Box>
      {error && <Alert severity="warning">{error}</Alert>}
      {saved && <Alert severity="success">Evento creado correctamente.</Alert>}

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        {Object.entries(typeLabel).map(([key, label]) => (
          <Chip key={key} label={label} size="small" sx={{ bgcolor: typeColors[key], color: '#fff' }} />
        ))}
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <MainCard>
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
              <Box
                sx={{
                  '& .fc': { fontFamily: theme.typography.fontFamily },
                  '& .fc-toolbar-title': { fontSize: '1.15rem', fontWeight: 600 },
                  '& .fc-button': { backgroundColor: theme.palette.primary.main, borderColor: theme.palette.primary.main, textTransform: 'capitalize' },
                  '& .fc-button:hover': { backgroundColor: theme.palette.primary.dark },
                  '& .fc-button-active': { backgroundColor: `${theme.palette.primary.dark} !important` },
                  '& .fc-event-cancelled': { opacity: 0.5, textDecoration: 'line-through' },
                  '& .fc-daygrid-day.fc-day-today, & .fc-timegrid-col.fc-day-today': { backgroundColor: theme.palette.primary.lighter || 'rgba(33,150,243,0.08)' }
                }}
              >
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' }}
                  locale={esLocale}
                  height="auto"
                  selectable
                  select={handleDateSelect}
                  events={calendarEvents}
                  eventClick={handleEventClick}
                  dayMaxEvents={3}
                />
              </Box>
            )}
          </MainCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <MainCard title="Crear evento" id="new-event">
            <Stack component="form" spacing={2} onSubmit={createEvent}>
              <TextField select fullWidth label="Tipo" value={form.type} onChange={(event) => applyType(event.target.value)}>
                <MenuItem value="RECEIVING">Recepción</MenuItem>
                <MenuItem value="DELIVERY">Entrega</MenuItem>
                <MenuItem value="APPOINTMENT">Cita</MenuItem>
                <MenuItem value="WORK">Trabajo</MenuItem>
              </TextField>
              <TextField select fullWidth label="Cliente (opcional)" value={form.customerId || searchParams.get('customerId') || ''} onChange={(event) => applyCustomer(event.target.value)}>
                <MenuItem value="">Sin asociar</MenuItem>
                {customers.map((customer) => <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>)}
              </TextField>
              <TextField required fullWidth label="Título" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Entrega iPhone 12" helperText="Se sugiere solo según el tipo y cliente; puedes editarlo." />
              <TextField required fullWidth type="datetime-local" label="Inicio" InputLabelProps={{ shrink: true }} value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
              <TextField required fullWidth type="datetime-local" label="Fin" InputLabelProps={{ shrink: true }} value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
              <TextField fullWidth multiline minRows={2} label="Notas" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              <Divider />
              <Button type="submit" variant="contained" startIcon={<EventAvailableRoundedIcon />}>Guardar evento</Button>
              <Typography variant="caption" color="text.secondary">Tip: selecciona un rango en el calendario para prellenar la fecha.</Typography>
            </Stack>
          </MainCard>
        </Grid>
      </Grid>

      <Dialog open={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} fullWidth maxWidth="xs">
        {selectedEvent && (
          <>
            <DialogTitle>{selectedEvent.title}</DialogTitle>
            <DialogContent>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1}>
                  <Chip label={typeLabel[selectedEvent.type] || selectedEvent.type} size="small" sx={{ bgcolor: typeColors[selectedEvent.type], color: '#fff' }} />
                  <Chip label={statusLabel[selectedEvent.status] || selectedEvent.status} size="small" variant="outlined" />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {new Date(selectedEvent.startsAt).toLocaleString('es-MX')} — {new Date(selectedEvent.endsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                {selectedEvent.customer && <Typography variant="body2">Cliente: {selectedEvent.customer.name}</Typography>}
                {selectedEvent.serviceOrder && <Typography variant="body2">Orden: {selectedEvent.serviceOrder.folio}</Typography>}
                {selectedEvent.notes && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedEvent.notes}</Typography>}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedEvent(null)}>Cerrar</Button>
              {selectedEvent.status === 'SCHEDULED' && (
                <>
                  <Button color="error" startIcon={<CancelRoundedIcon />} onClick={() => changeStatus('CANCELLED')} disabled={updatingStatus}>Cancelar</Button>
                  <Button variant="contained" color="success" startIcon={<CheckCircleRoundedIcon />} onClick={() => changeStatus('COMPLETED')} disabled={updatingStatus}>Completar</Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  );
}
