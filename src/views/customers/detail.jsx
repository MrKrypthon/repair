import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DevicesOtherRoundedIcon from '@mui/icons-material/DevicesOtherRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import ConfirmDialog from 'ui-component/ConfirmDialog';
import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const statusLabels = {
  RECIBIDO: 'Recibido',
  EN_DIAGNOSTICO: 'En diagnóstico',
  EN_REPARACION: 'En reparación',
  LISTO_ENTREGA: 'Listo para entrega',
  ENTREGADO: 'Entregado'
};

export default function CustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState('');
  const [device, setDevice] = useState({ category: 'CELULAR', brand: '', model: '', serialNumber: '', imei: '', color: '', notes: '' });
  const [savingDevice, setSavingDevice] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [allCustomers, setAllCustomers] = useState([]);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  useEffect(() => {
    api
      .getCustomer(customerId)
      .then((data) => {
        setCustomer(data);
        setEditForm({ name: data.name, phone: data.phone, email: data.email || '', notes: data.notes || '' });
      })
      .catch(() => setError('No se pudo cargar la ficha del cliente.'));
  }, [customerId]);
  useEffect(() => {
    api
      .listCustomers()
      .then(setAllCustomers)
      .catch(() => {});
  }, []);

  const knownDevices = useMemo(() => allCustomers.flatMap((item) => item.devices || []), [allCustomers]);
  const brandOptions = useMemo(
    () => [...new Set(knownDevices.map((item) => item.brand))].sort((a, b) => a.localeCompare(b)),
    [knownDevices]
  );
  const modelOptions = useMemo(() => {
    const matches = device.brand ? knownDevices.filter((item) => item.brand.toLowerCase() === device.brand.toLowerCase()) : knownDevices;
    return [...new Set(matches.map((item) => item.model))].sort((a, b) => a.localeCompare(b));
  }, [knownDevices, device.brand]);
  const pickModel = (model) => {
    const match = knownDevices.find(
      (item) => item.model === model && (!device.brand || item.brand.toLowerCase() === device.brand.toLowerCase())
    );
    setDevice((current) => ({ ...current, model, ...(match ? { category: match.category, brand: match.brand } : {}) }));
  };

  const saveDevice = (event) => {
    event.preventDefault();
    setSavingDevice(true);
    api
      .createDevice(customerId, device)
      .then(() => {
        setDevice({ category: 'CELULAR', brand: '', model: '', serialNumber: '', imei: '', color: '', notes: '' });
        return api.getCustomer(customerId).then(setCustomer);
      })
      .catch(() => setError('No se pudo registrar el equipo.'))
      .finally(() => setSavingDevice(false));
  };
  const saveCustomer = (event) => {
    event.preventDefault();
    setSavingCustomer(true);
    api
      .updateCustomer(customerId, editForm)
      .then((data) => {
        setCustomer((current) => ({ ...current, ...data }));
        setEditing(false);
      })
      .catch(() => setError('No se pudo actualizar el cliente.'))
      .finally(() => setSavingCustomer(false));
  };
  const archiveCustomer = () => {
    api
      .archiveCustomer(customerId, false)
      .then(() => navigate('/customers'))
      .catch(() => setError('No se pudo archivar el cliente.'));
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!customer)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );

  const phoneDigits = customer.phone.replace(/\D/g, '');
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Button component={Link} to="/customers" startIcon={<ArrowBackRoundedIcon />}>
          Clientes
        </Button>
        <Typography color="text.secondary">/ Ficha</Typography>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.lighter', color: 'primary.main' }}>
            {customer.name
              .split(' ')
              .map((part) => part[0])
              .slice(0, 2)
              .join('')}
          </Avatar>
          <Box>
            <Typography variant="h2">{customer.name}</Typography>
            <Typography color="text.secondary">
              {customer.phone} {customer.email ? `· ${customer.email}` : ''}
            </Typography>
          </Box>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component="a" href={`tel:${customer.phone}`} variant="outlined" startIcon={<CallRoundedIcon />}>
            Llamar
          </Button>
          {customer.email && (
            <Button component="a" href={`mailto:${customer.email}`} variant="outlined" startIcon={<EmailRoundedIcon />}>
              Correo
            </Button>
          )}
          <Button
            component="a"
            href={`https://wa.me/${phoneDigits}`}
            target="_blank"
            rel="noreferrer"
            variant="outlined"
            startIcon={<WhatsAppIcon />}
          >
            WhatsApp
          </Button>
          <Button
            component={Link}
            to={`/appointments?customerId=${customer.id}`}
            variant="outlined"
            startIcon={<EventAvailableRoundedIcon />}
          >
            Nueva cita
          </Button>
          <Button variant="outlined" onClick={() => setEditing((value) => !value)}>
            {editing ? 'Cerrar edición' : 'Editar cliente'}
          </Button>
          <Button color="error" onClick={() => setConfirmArchiveOpen(true)}>
            Archivar
          </Button>
          <Button component={Link} to={`/service-orders/new?customerId=${customer.id}`} variant="contained" startIcon={<AddRoundedIcon />}>
            Nueva orden
          </Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {editing && (
        <MainCard title="Editar datos del cliente">
          <Stack component="form" spacing={2} onSubmit={saveCustomer}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                required
                fullWidth
                label="Nombre"
                value={editForm.name}
                onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
              />
              <TextField
                required
                fullWidth
                label="Teléfono"
                value={editForm.phone}
                onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })}
              />
              <TextField
                fullWidth
                label="Correo"
                value={editForm.email}
                onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
              />
            </Stack>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Notas"
              value={editForm.notes}
              onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })}
            />
            <Button type="submit" variant="contained" disabled={savingCustomer}>
              {savingCustomer ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </Stack>
        </MainCard>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <MainCard title="Equipos registrados" sx={{ flex: 1 }}>
          {customer.devices.length ? (
            <Stack spacing={2}>
              {customer.devices.map((item) => (
                <Stack direction="row" spacing={1.5} key={item.id} sx={{ alignItems: 'center' }}>
                  <DevicesOtherRoundedIcon color="primary" />
                  <Box>
                    <Typography fontWeight={600}>
                      {item.brand} {item.model}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.category} {item.imei ? `· IMEI ${item.imei}` : ''}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">Todavía no hay equipos registrados.</Typography>
          )}
        </MainCard>
        <MainCard title="Historial de órdenes" sx={{ flex: 1 }}>
          {customer.orders.length ? (
            <Stack spacing={1.5}>
              {customer.orders.map((order) => (
                <Box key={order.id}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button component={Link} to={`/service-orders/${order.folio}`} sx={{ p: 0, minWidth: 0 }}>
                      {order.folio}
                    </Button>
                    <Chip size="small" label={statusLabels[order.status] || order.status} variant="outlined" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {order.device.brand} {order.device.model} · {order.reportedIssue}
                  </Typography>
                  {order !== customer.orders[customer.orders.length - 1] && <Divider sx={{ mt: 1.5 }} />}
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">No hay órdenes registradas.</Typography>
          )}
        </MainCard>
      </Stack>
      <MainCard title="Registrar equipo">
        <Stack component="form" spacing={2} onSubmit={saveDevice}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              label="Tipo"
              value={device.category}
              onChange={(event) => setDevice({ ...device, category: event.target.value })}
            >
              <MenuItem value="CELULAR">Celular</MenuItem>
              <MenuItem value="TABLET">Tablet</MenuItem>
              <MenuItem value="LAPTOP">Laptop</MenuItem>
              <MenuItem value="CONSOLA">Consola</MenuItem>
              <MenuItem value="TARJETA_ELECTRONICA">Tarjeta electrónica</MenuItem>
              <MenuItem value="OTRO">Otro</MenuItem>
            </TextField>
            <Autocomplete
              freeSolo
              fullWidth
              options={brandOptions}
              inputValue={device.brand}
              onInputChange={(event, value) => setDevice({ ...device, brand: value })}
              renderInput={(params) => <TextField {...params} required label="Marca" />}
            />
            <Autocomplete
              freeSolo
              fullWidth
              options={modelOptions}
              inputValue={device.model}
              onInputChange={(event, value) => pickModel(value)}
              renderInput={(params) => <TextField {...params} required label="Modelo" />}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="IMEI"
              value={device.imei}
              onChange={(event) => setDevice({ ...device, imei: event.target.value })}
            />
            <TextField
              fullWidth
              label="Número de serie"
              value={device.serialNumber}
              onChange={(event) => setDevice({ ...device, serialNumber: event.target.value })}
            />
            <TextField
              fullWidth
              label="Color"
              value={device.color}
              onChange={(event) => setDevice({ ...device, color: event.target.value })}
            />
          </Stack>
          <TextField
            fullWidth
            label="Notas del equipo"
            value={device.notes}
            onChange={(event) => setDevice({ ...device, notes: event.target.value })}
          />
          <Button type="submit" variant="outlined" disabled={savingDevice}>
            {savingDevice ? 'Guardando...' : 'Registrar equipo'}
          </Button>
        </Stack>
      </MainCard>
      <ConfirmDialog
        open={confirmArchiveOpen}
        title="Archivar cliente"
        description="Su historial de órdenes y cotizaciones se conservará, pero dejará de aparecer en las búsquedas activas."
        confirmLabel="Archivar"
        onConfirm={archiveCustomer}
        onClose={() => setConfirmArchiveOpen(false)}
      />
    </Stack>
  );
}
