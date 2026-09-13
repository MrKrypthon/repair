import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const statusLabels = { DRAFT: 'Borrador', SENT: 'Enviada', APPROVED: 'Aprobada', REJECTED: 'Rechazada', CONVERTED: 'Convertida' };
const statusColors = { DRAFT: 'default', SENT: 'info', APPROVED: 'success', REJECTED: 'error', CONVERTED: 'primary' };

const money = (value) => `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
const total = (quotation) => quotation.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = () => {
    setLoading(true);
    api.listQuotations(statusFilter === 'ALL' ? undefined : statusFilter).then(setQuotations).catch(() => setError('No se pudieron cargar las cotizaciones.')).finally(() => setLoading(false));
  };
  useEffect(load, [statusFilter]);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h2">Cotizaciones</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Genera y da seguimiento a las cotizaciones para tus clientes.</Typography>
        </Box>
        <Button component={Link} to="/quotations/new" variant="contained" startIcon={<AddRoundedIcon />}>Nueva cotización</Button>
      </Stack>
      {error && <Alert severity="warning">{error}</Alert>}
      <MainCard content={false}>
        <Stack direction="row" sx={{ p: 2.5, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Todas las cotizaciones <Typography component="span" color="text.secondary" variant="body2">({quotations.length})</Typography></Typography>
          <TextField select size="small" label="Estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} sx={{ minWidth: 170 }}>
            <MenuItem value="ALL">Todos</MenuItem>
            {Object.entries(statusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
        </Stack>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 760 }}>
            <TableHead><TableRow><TableCell>Folio</TableCell><TableCell>Cliente / equipo</TableCell><TableCell>Total</TableCell><TableCell>Estado</TableCell><TableCell>Válida hasta</TableCell><TableCell>Creada</TableCell></TableRow></TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} sx={{ my: 3 }} /></TableCell></TableRow>
              ) : quotations.length ? (
                quotations.map((quotation) => (
                  <TableRow hover key={quotation.folio}>
                    <TableCell><Button component={Link} to={`/quotations/${quotation.folio}`} sx={{ p: 0, minWidth: 0 }}>{quotation.folio}</Button></TableCell>
                    <TableCell><Typography fontWeight={600}>{quotation.customer.name}</Typography><Typography variant="caption" color="text.secondary">{quotation.device.brand} {quotation.device.model}</Typography></TableCell>
                    <TableCell>{money(total(quotation))}</TableCell>
                    <TableCell><Chip label={statusLabels[quotation.status] || quotation.status} color={statusColors[quotation.status] || 'default'} size="small" variant="outlined" /></TableCell>
                    <TableCell>{quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('es-MX') : '-'}</TableCell>
                    <TableCell>{new Date(quotation.createdAt).toLocaleDateString('es-MX')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary" sx={{ my: 3 }}>Sin cotizaciones registradas.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </MainCard>
    </Stack>
  );
}
