import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

export default function NewServiceOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customer: searchParams.get('customerId') || '', deviceId: '', category: '', brand: '', model: '', issue: '', priority: 'NORMAL', estimatedDeliveryAt: '' });
  const [devices, setDevices] = useState([]);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  useEffect(() => {
    api.listCustomers().then(setCustomers).catch(() => setError('No se pudo cargar la lista de clientes. Inicia el backend para crear órdenes.'));
  }, []);
  useEffect(() => { if (form.customer) api.getCustomer(form.customer).then((customer) => setDevices(customer.devices)).catch(() => setDevices([])); else setDevices([]); }, [form.customer]);

  const submit = (event) => {
    event.preventDefault();
    setError('');
    api.createServiceOrder({ customerId: form.customer, deviceId: form.deviceId || undefined, category: form.category, brand: form.brand, model: form.model, reportedIssue: form.issue, priority: form.priority, estimatedDeliveryAt: form.estimatedDeliveryAt || undefined })
      .then(() => { setSaved(true); window.setTimeout(() => navigate('/service-orders'), 700); })
      .catch(() => setError('No se pudo crear la orden. Revisa la conexión con el backend y los datos del formulario.'));
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Button component={Link} to="/service-orders" startIcon={<ArrowBackRoundedIcon />}>Órdenes</Button><Typography color="text.secondary">/ Nueva orden</Typography></Stack>
      <Stack><Typography variant="h2">Nueva orden de servicio</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Registra la recepción del equipo para iniciar su trazabilidad.</Typography></Stack>
      {saved && <Alert severity="success">Orden creada correctamente. Redirigiendo al listado...</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <MainCard title="Datos de recepción">
        <Stack component="form" spacing={3} onSubmit={submit}>
          <Typography variant="h4">Cliente y equipo</Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}><TextField required select fullWidth label="Cliente" value={form.customer} onChange={update('customer')}>{customers.map((customer) => <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>)}</TextField></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField select fullWidth label="Equipo existente (opcional)" value={form.deviceId} onChange={update('deviceId')}><MenuItem value="">Registrar equipo nuevo</MenuItem>{devices.map((device) => <MenuItem key={device.id} value={device.id}>{device.brand} {device.model} · {device.category}</MenuItem>)}</TextField></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField required={!form.deviceId} select fullWidth label="Tipo de equipo" value={form.category} onChange={update('category')}><MenuItem value="CELULAR">Celular</MenuItem><MenuItem value="TABLET">Tablet</MenuItem><MenuItem value="LAPTOP">Laptop</MenuItem><MenuItem value="CONSOLA">Consola</MenuItem><MenuItem value="OTRO">Otro</MenuItem></TextField></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField required={!form.deviceId} fullWidth label="Marca" placeholder="Ej. Apple" value={form.brand} onChange={update('brand')} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField required={!form.deviceId} fullWidth label="Modelo" placeholder="Ej. iPhone 12" value={form.model} onChange={update('model')} /></Grid>
          </Grid>
          <Typography variant="h4">Falla y prioridad</Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 8 }}><TextField required fullWidth multiline minRows={4} label="Falla reportada por el cliente" placeholder="Describe el problema tal como lo explica el cliente..." value={form.issue} onChange={update('issue')} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField select fullWidth label="Prioridad" value={form.priority} onChange={update('priority')}><MenuItem value="NORMAL">Normal</MenuItem><MenuItem value="ALTA">Alta</MenuItem><MenuItem value="URGENTE">Urgente</MenuItem></TextField></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth type="datetime-local" label="Entrega estimada" InputLabelProps={{ shrink: true }} value={form.estimatedDeliveryAt} onChange={update('estimatedDeliveryAt')} /></Grid>
          </Grid>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}><Button component={Link} to="/service-orders">Cancelar</Button><Button type="submit" variant="contained" startIcon={<SaveRoundedIcon />}>Crear orden</Button></Stack>
        </Stack>
      </MainCard>
    </Stack>
  );
}
