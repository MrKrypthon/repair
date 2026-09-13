import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const emptyItem = { description: '', quantity: 1, unitPrice: '' };
const money = (value) => `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

export default function NewQuotation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [form, setForm] = useState({ customer: searchParams.get('customerId') || '', deviceId: '', category: '', brand: '', model: '', issueDescription: '', notes: '', validUntil: '' });
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(emptyItem);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  useEffect(() => {
    api.listCustomers().then(setCustomers).catch(() => setError('No se pudo cargar la lista de clientes. Inicia el backend para crear cotizaciones.'));
  }, []);
  useEffect(() => { if (form.customer) api.getCustomer(form.customer).then((customer) => setDevices(customer.devices)).catch(() => setDevices([])); else setDevices([]); }, [form.customer]);

  const addItem = () => {
    if (!draft.description || !draft.quantity || draft.unitPrice === '') return;
    setItems([...items, { ...draft, quantity: Number(draft.quantity), unitPrice: Number(draft.unitPrice) }]);
    setDraft(emptyItem);
  };
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const submit = (event) => {
    event.preventDefault();
    setError('');
    if (!items.length) { setError('Agrega al menos un concepto a la cotización.'); return; }
    api.createQuotation({
      customerId: form.customer,
      deviceId: form.deviceId || undefined,
      category: form.deviceId ? undefined : form.category,
      brand: form.deviceId ? undefined : form.brand,
      model: form.deviceId ? undefined : form.model,
      issueDescription: form.issueDescription,
      notes: form.notes || undefined,
      validUntil: form.validUntil || undefined,
      items
    })
      .then((quotation) => { setSaved(true); window.setTimeout(() => navigate(`/quotations/${quotation.folio}`), 700); })
      .catch(() => setError('No se pudo crear la cotización. Revisa la conexión con el backend y los datos del formulario.'));
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Button component={Link} to="/quotations" startIcon={<ArrowBackRoundedIcon />}>Cotizaciones</Button><Typography color="text.secondary">/ Nueva cotización</Typography></Stack>
      <Stack><Typography variant="h2">Nueva cotización</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Arma el detalle de piezas y mano de obra para enviarla al cliente.</Typography></Stack>
      {saved && <Alert severity="success">Cotización creada correctamente. Redirigiendo...</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <MainCard title="Datos de la cotización">
        <Stack component="form" spacing={3} onSubmit={submit}>
          <Typography variant="h4">Cliente y equipo</Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}><TextField required select fullWidth label="Cliente" value={form.customer} onChange={update('customer')}>{customers.map((customer) => <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>)}</TextField></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField select fullWidth label="Equipo existente (opcional)" value={form.deviceId} onChange={update('deviceId')}><MenuItem value="">Registrar equipo nuevo</MenuItem>{devices.map((device) => <MenuItem key={device.id} value={device.id}>{device.brand} {device.model} · {device.category}</MenuItem>)}</TextField></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField required={!form.deviceId} select fullWidth label="Tipo de equipo" value={form.category} onChange={update('category')}><MenuItem value="CELULAR">Celular</MenuItem><MenuItem value="TABLET">Tablet</MenuItem><MenuItem value="LAPTOP">Laptop</MenuItem><MenuItem value="CONSOLA">Consola</MenuItem><MenuItem value="OTRO">Otro</MenuItem></TextField></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField required={!form.deviceId} fullWidth label="Marca" placeholder="Ej. Apple" value={form.brand} onChange={update('brand')} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField required={!form.deviceId} fullWidth label="Modelo" placeholder="Ej. iPhone 12" value={form.model} onChange={update('model')} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth type="date" label="Válida hasta (opcional)" InputLabelProps={{ shrink: true }} value={form.validUntil} onChange={update('validUntil')} /></Grid>
          </Grid>
          <Typography variant="h4">Falla reportada</Typography>
          <TextField required fullWidth multiline minRows={3} label="Falla reportada por el cliente" placeholder="Describe el problema tal como lo explica el cliente..." value={form.issueDescription} onChange={update('issueDescription')} />
          <Typography variant="h4">Conceptos</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField fullWidth label="Descripción" placeholder="Ej. Pantalla OLED" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            <TextField type="number" label="Cantidad" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} inputProps={{ min: 1 }} sx={{ minWidth: 110 }} />
            <TextField type="number" label="Precio unitario" value={draft.unitPrice} onChange={(event) => setDraft({ ...draft, unitPrice: event.target.value })} inputProps={{ min: 0, step: '0.01' }} sx={{ minWidth: 140 }} />
            <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={addItem} sx={{ whiteSpace: 'nowrap' }}>Agregar</Button>
          </Stack>
          {!!items.length && (
            <Stack spacing={1}>
              {items.map((item, index) => (
                <Stack direction="row" key={`${item.description}-${index}`} sx={{ justifyContent: 'space-between', alignItems: 'center', p: 1.25, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography>{item.description} × {item.quantity}</Typography>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Typography fontWeight={600}>{money(item.quantity * item.unitPrice)}</Typography>
                    <IconButton size="small" color="error" onClick={() => removeItem(index)}><DeleteRoundedIcon fontSize="small" /></IconButton>
                  </Stack>
                </Stack>
              ))}
              <Stack direction="row" sx={{ justifyContent: 'flex-end', pt: 1 }}><Typography variant="h4">Total: {money(total)}</Typography></Stack>
            </Stack>
          )}
          <TextField fullWidth multiline minRows={2} label="Notas (opcional)" placeholder="Condiciones, tiempos de entrega, etc." value={form.notes} onChange={update('notes')} />
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}><Button component={Link} to="/quotations">Cancelar</Button><Button type="submit" variant="contained" startIcon={<SaveRoundedIcon />}>Crear cotización</Button></Stack>
        </Stack>
      </MainCard>
    </Stack>
  );
}
