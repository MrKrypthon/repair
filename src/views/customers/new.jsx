import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

export default function NewCustomer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    api
      .createCustomer(form)
      .then(() => navigate('/customers'))
      .catch(() => setError('No se pudo guardar el cliente. Verifica tu conexión e intenta de nuevo.'))
      .finally(() => setSaving(false));
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Button component={Link} to="/customers" startIcon={<ArrowBackRoundedIcon />}>
          Clientes
        </Button>
        <Typography color="text.secondary">/ Nuevo cliente</Typography>
      </Stack>
      <BoxHeader />
      <MainCard title="Datos del cliente">
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        <Stack component="form" spacing={3} onSubmit={submit}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField required fullWidth label="Nombre completo" value={form.name} onChange={update('name')} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField required fullWidth label="Teléfono" value={form.phone} onChange={update('phone')} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField type="email" fullWidth label="Correo electrónico (opcional)" value={form.email} onChange={update('email')} />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Notas"
                placeholder="Preferencias, información adicional o avisos del cliente..."
                value={form.notes}
                onChange={update('notes')}
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button component={Link} to="/customers">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" startIcon={<SaveRoundedIcon />} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cliente'}
            </Button>
          </Stack>
        </Stack>
      </MainCard>
    </Stack>
  );
}

function BoxHeader() {
  return (
    <Stack>
      <Typography variant="h2">Nuevo cliente</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
        Registra sus datos antes de recibir un equipo.
      </Typography>
    </Stack>
  );
}
