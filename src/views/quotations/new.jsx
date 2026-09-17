import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
const COMMON_ISSUES = [
  'Pantalla rota',
  'No enciende',
  'No carga / batería',
  'Se mojó',
  'Botones no responden',
  'Cámara no funciona',
  'Audio/bocina falla',
  'Lento o se congela'
];

export default function NewQuotation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [form, setForm] = useState({
    customer: searchParams.get('customerId') || '',
    deviceId: '',
    category: '',
    brand: '',
    model: '',
    issueDescription: '',
    notes: '',
    validUntil: ''
  });
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(emptyItem);
  const [catalogOptions, setCatalogOptions] = useState([]);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  useEffect(() => {
    api
      .listCustomers()
      .then(setCustomers)
      .catch(() => setError('No se pudo cargar la lista de clientes. Verifica tu conexión e intenta de nuevo.'));
  }, []);
  useEffect(() => {
    if (form.customer)
      api
        .getCustomer(form.customer)
        .then((customer) => setDevices(customer.devices))
        .catch(() => setDevices([]));
    else setDevices([]);
  }, [form.customer]);

  const knownDevices = useMemo(() => customers.flatMap((customer) => customer.devices || []), [customers]);
  const brandOptions = useMemo(
    () => [...new Set(knownDevices.map((device) => device.brand))].sort((a, b) => a.localeCompare(b)),
    [knownDevices]
  );
  const modelOptions = useMemo(() => {
    const matches = form.brand ? knownDevices.filter((device) => device.brand.toLowerCase() === form.brand.toLowerCase()) : knownDevices;
    return [...new Set(matches.map((device) => device.model))].sort((a, b) => a.localeCompare(b));
  }, [knownDevices, form.brand]);

  const pickModel = (model) => {
    const match = knownDevices.find(
      (device) => device.model === model && (!form.brand || device.brand.toLowerCase() === form.brand.toLowerCase())
    );
    setForm((current) => ({ ...current, model, ...(match ? { category: match.category, brand: match.brand } : {}) }));
  };

  const addIssue = (issue) => {
    setForm((current) => ({ ...current, issueDescription: current.issueDescription ? `${current.issueDescription}; ${issue}` : issue }));
  };

  useEffect(() => {
    Promise.all([api.listInventory(), api.listServiceCatalog()])
      .then(([parts, services]) => {
        setCatalogOptions([
          ...parts.map((part) => ({
            key: `part-${part.id}`,
            label: part.name,
            source: 'Piezas',
            price: Number(part.salePrice),
            sku: part.sku
          })),
          ...services.map((service) => ({
            key: `service-${service.id}`,
            label: service.name,
            source: 'Servicios y mano de obra',
            price: Number(service.price)
          }))
        ]);
      })
      .catch(() => {});
  }, []);

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
    if (!items.length) {
      setError('Agrega al menos un concepto a la cotización.');
      return;
    }
    setSaving(true);
    api
      .createQuotation({
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
      .then((quotation) => {
        setSaved(true);
        window.setTimeout(() => navigate(`/quotations/${quotation.folio}`), 700);
      })
      .catch(() => {
        setError('No se pudo crear la cotización. Revisa tu conexión y los datos del formulario.');
        setSaving(false);
      });
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Button component={Link} to="/quotations" startIcon={<ArrowBackRoundedIcon />}>
          Cotizaciones
        </Button>
        <Typography color="text.secondary">/ Nueva cotización</Typography>
      </Stack>
      <Stack>
        <Typography variant="h2">Nueva cotización</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Arma el detalle de piezas y mano de obra para enviarla al cliente.
        </Typography>
      </Stack>
      {saved && <Alert severity="success">Cotización creada correctamente. Redirigiendo...</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <MainCard title="Datos de la cotización">
        <Stack component="form" spacing={3} onSubmit={submit}>
          <Typography variant="h4">Cliente y equipo</Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField required select fullWidth label="Cliente" value={form.customer} onChange={update('customer')}>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField select fullWidth label="Equipo existente (opcional)" value={form.deviceId} onChange={update('deviceId')}>
                <MenuItem value="">Registrar equipo nuevo</MenuItem>
                {devices.map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.brand} {device.model} · {device.category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                required={!form.deviceId}
                select
                fullWidth
                label="Tipo de equipo"
                value={form.category}
                onChange={update('category')}
              >
                <MenuItem value="CELULAR">Celular</MenuItem>
                <MenuItem value="TABLET">Tablet</MenuItem>
                <MenuItem value="LAPTOP">Laptop</MenuItem>
                <MenuItem value="CONSOLA">Consola</MenuItem>
                <MenuItem value="OTRO">Otro</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                fullWidth
                options={brandOptions}
                inputValue={form.brand}
                onInputChange={(event, value) => setForm((current) => ({ ...current, brand: value }))}
                renderInput={(params) => <TextField {...params} required={!form.deviceId} label="Marca" placeholder="Ej. Apple" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                fullWidth
                options={modelOptions}
                inputValue={form.model}
                onInputChange={(event, value) => pickModel(value)}
                renderInput={(params) => <TextField {...params} required={!form.deviceId} label="Modelo" placeholder="Ej. iPhone 12" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Válida hasta (opcional)"
                InputLabelProps={{ shrink: true }}
                value={form.validUntil}
                onChange={update('validUntil')}
              />
            </Grid>
          </Grid>
          <Typography variant="h4">Falla reportada</Typography>
          <Stack spacing={1}>
            <TextField
              required
              fullWidth
              multiline
              minRows={3}
              label="Falla reportada por el cliente"
              placeholder="Describe el problema tal como lo explica el cliente..."
              value={form.issueDescription}
              onChange={update('issueDescription')}
            />
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {COMMON_ISSUES.map((issue) => (
                <Chip key={issue} label={issue} size="small" variant="outlined" onClick={() => addIssue(issue)} />
              ))}
            </Stack>
          </Stack>
          <Typography variant="h4">Conceptos</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: -1.5 }}>
            Elige una pieza o servicio del catálogo para que el precio se llene solo, o escribe un concepto libre y captura el precio a
            mano.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Autocomplete
              freeSolo
              fullWidth
              options={catalogOptions}
              groupBy={(option) => option.source}
              getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
              filterOptions={(options, state) =>
                options.filter((option) => option.label.toLowerCase().includes(state.inputValue.toLowerCase())).slice(0, 30)
              }
              inputValue={draft.description}
              onInputChange={(event, newValue) => setDraft((current) => ({ ...current, description: newValue }))}
              onChange={(event, value) => {
                if (value && typeof value !== 'string') {
                  setDraft((current) => ({ ...current, description: value.label, unitPrice: value.price }));
                }
              }}
              renderOption={(props, option) => (
                <Stack component="li" {...props} key={option.key} direction="row" sx={{ justifyContent: 'space-between', width: '100%' }}>
                  <Typography variant="body2">
                    {option.label}
                    {option.sku ? ` · ${option.sku}` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {money(option.price)}
                  </Typography>
                </Stack>
              )}
              renderInput={(params) => <TextField {...params} label="Descripción" placeholder="Escribe o elige del catálogo..." />}
            />
            <TextField
              type="number"
              label="Cantidad"
              value={draft.quantity}
              onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
              inputProps={{ min: 1 }}
              sx={{ minWidth: 110 }}
            />
            <TextField
              type="number"
              label="Precio unitario"
              value={draft.unitPrice}
              onChange={(event) => setDraft({ ...draft, unitPrice: event.target.value })}
              inputProps={{ min: 0, step: '0.01' }}
              sx={{ minWidth: 140 }}
            />
            <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={addItem} sx={{ whiteSpace: 'nowrap' }}>
              Agregar
            </Button>
          </Stack>
          {!!items.length && (
            <Stack spacing={1}>
              {items.map((item, index) => (
                <Stack
                  direction="row"
                  key={`${item.description}-${index}`}
                  sx={{ justifyContent: 'space-between', alignItems: 'center', p: 1.25, bgcolor: 'grey.50', borderRadius: 1 }}
                >
                  <Typography>
                    {item.description} × {item.quantity}
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Typography fontWeight={600}>{money(item.quantity * item.unitPrice)}</Typography>
                    <IconButton size="small" color="error" title="Quitar concepto" onClick={() => removeItem(index)}>
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              ))}
              <Stack direction="row" sx={{ justifyContent: 'flex-end', pt: 1 }}>
                <Typography variant="h4">Total: {money(total)}</Typography>
              </Stack>
            </Stack>
          )}
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Notas (opcional)"
            placeholder="Condiciones, tiempos de entrega, etc."
            value={form.notes}
            onChange={update('notes')}
          />
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button component={Link} to="/quotations">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" startIcon={<SaveRoundedIcon />} disabled={saving}>
              {saving ? 'Guardando...' : 'Crear cotización'}
            </Button>
          </Stack>
        </Stack>
      </MainCard>
    </Stack>
  );
}
