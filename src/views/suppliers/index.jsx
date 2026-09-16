import { useEffect, useState } from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [creating, setCreating] = useState(false);
  const load = () =>
    api
      .listSuppliers()
      .then(setSuppliers)
      .catch(() => setError('No se pudo cargar proveedores.'))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const create = (event) => {
    event.preventDefault();
    setCreating(true);
    api
      .createSupplier(form)
      .then(() => {
        setOpen(false);
        setForm({ name: '', phone: '', email: '', notes: '' });
        return load();
      })
      .catch(() => setError('No se pudo crear el proveedor.'))
      .finally(() => setCreating(false));
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h2">Proveedores</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Contactos asociados a piezas y consumibles.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>
          Nuevo proveedor
        </Button>
      </Stack>
      {error && <Alert severity="warning">{error}</Alert>}
      <MainCard title="Proveedores activos">
        <Stack spacing={1.5}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : suppliers.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              Todavía no hay proveedores registrados.
            </Typography>
          ) : (
            suppliers.map((supplier) => (
            <Stack
              direction="row"
              spacing={2}
              key={supplier.id}
              sx={{ alignItems: 'center', p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                <BusinessRoundedIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={600}>{supplier.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {supplier.phone || 'Sin teléfono'} {supplier.email ? `· ${supplier.email}` : ''}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {supplier._count.items} piezas
              </Typography>
            </Stack>
            ))
          )}
        </Stack>
      </MainCard>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo proveedor</DialogTitle>
        <Stack component="form" onSubmit={create}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                required
                fullWidth
                label="Nombre"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <TextField
                fullWidth
                label="Teléfono"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
              <TextField
                type="email"
                fullWidth
                label="Correo"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Notas"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={creating}>
              {creating ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Stack>
  );
}
