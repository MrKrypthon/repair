import { useEffect, useState } from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const emptyForm = { name: '', description: '', cost: '', price: '' };
const money = (value) => `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

export default function ServiceCatalog() {
  const [items, setItems] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .listServiceCatalog('', showInactive)
      .then(setItems)
      .catch(() => setError('No se pudo cargar el catálogo de servicios.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [showInactive]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name, description: item.description || '', cost: item.cost, price: item.price });
    setOpen(true);
  };

  const save = (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = { name: form.name, description: form.description || undefined, cost: Number(form.cost || 0), price: Number(form.price) };
    const request = editingId ? api.updateServiceCatalogItem(editingId, payload) : api.createServiceCatalogItem(payload);
    request
      .then(() => {
        setOpen(false);
        return load();
      })
      .catch(() => setError('No se pudo guardar el servicio. Revisa los datos.'))
      .finally(() => setSaving(false));
  };

  const toggleActive = (item) => {
    api.archiveServiceCatalogItem(item.id, !item.active).then(load).catch(() => setError('No se pudo actualizar el servicio.'));
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h2">Servicios y mano de obra</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Precios de referencia para cotizaciones: al agregar un concepto, se puede elegir de aquí y el precio se llena solo.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          Nuevo servicio
        </Button>
      </Stack>

      {error && <Alert severity="warning">{error}</Alert>}

      <MainCard content={false}>
        <Stack direction="row" sx={{ p: 2.5, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">
            Catálogo <Typography component="span" color="text.secondary" variant="body2">({items.length})</Typography>
          </Typography>
          <FormControlLabel
            control={<Switch checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />}
            label="Mostrar inactivos"
          />
        </Stack>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="right">Costo</TableCell>
                <TableCell align="right">Precio</TableCell>
                <TableCell align="right">Margen</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>Todavía no hay servicios registrados.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {items.map((item) => {
                const margin = Number(item.price) > 0 ? ((Number(item.price) - Number(item.cost)) / Number(item.price)) * 100 : 0;
                return (
                  <TableRow hover key={item.id}>
                    <TableCell><Typography fontWeight={600}>{item.name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{item.description || '-'}</Typography></TableCell>
                    <TableCell align="right">{money(item.cost)}</TableCell>
                    <TableCell align="right"><Typography fontWeight={600}>{money(item.price)}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={margin >= 0 ? 'success.dark' : 'error.main'}>{margin.toFixed(0)}%</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.active ? 'Activo' : 'Inactivo'} size="small" color={item.active ? 'success' : 'default'} variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(item)} title="Editar">
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => toggleActive(item)} title={item.active ? 'Desactivar' : 'Activar'}>
                        {item.active ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </MainCard>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
        <Stack component="form" onSubmit={save}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField required fullWidth label="Nombre" placeholder="Ej. Cambio de pantalla (mano de obra)" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <TextField fullWidth multiline minRows={2} label="Descripción (opcional)" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <Stack direction="row" spacing={2}>
                <TextField fullWidth type="number" label="Costo interno (opcional)" helperText="Lo que te cuesta dar el servicio, si aplica" value={form.cost} onChange={(event) => setForm({ ...form, cost: event.target.value })} inputProps={{ min: 0, step: '0.01' }} />
                <TextField required fullWidth type="number" label="Precio al cliente" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} inputProps={{ min: 0, step: '0.01' }} />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={saving || !form.name || form.price === ''}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Stack>
  );
}
