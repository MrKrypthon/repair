import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ForwardToInboxRoundedIcon from '@mui/icons-material/ForwardToInboxRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';
import { generateQuotationPdf } from 'utils/generateQuotationPdf';

const statusLabels = { DRAFT: 'Borrador', SENT: 'Enviada', APPROVED: 'Aprobada', REJECTED: 'Rechazada', CONVERTED: 'Convertida' };
const statusColors = { DRAFT: 'default', SENT: 'info', APPROVED: 'success', REJECTED: 'error', CONVERTED: 'primary' };
const money = (value) => `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

export default function QuotationDetail() {
  const { folio } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () => api.getQuotation(folio).then(setQuotation).catch(() => setMessage({ type: 'error', text: 'No se pudo cargar la cotización.' })).finally(() => setLoading(false));
  useEffect(load, [folio]);

  const changeStatus = (status) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    api.updateQuotationStatus(folio, status).then(setQuotation).catch(() => setMessage({ type: 'error', text: 'No se pudo actualizar el estado de la cotización.' })).finally(() => setSaving(false));
  };

  const convert = () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    api.convertQuotation(folio)
      .then((order) => navigate(`/service-orders/${order.folio}`))
      .catch(() => { setMessage({ type: 'error', text: 'No se pudo convertir la cotización en orden.' }); setSaving(false); });
  };

  if (loading) return <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>;
  if (!quotation) return <Alert severity="error">No se encontró la cotización.</Alert>;

  const total = quotation.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  const expired = quotation.validUntil && new Date(quotation.validUntil) < new Date() && ['DRAFT', 'SENT'].includes(quotation.status);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Button component={Link} to="/quotations" startIcon={<ArrowBackRoundedIcon />}>Cotizaciones</Button><Typography color="text.secondary">/ {folio}</Typography></Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="h2">{quotation.folio}</Typography>
            <Chip label={statusLabels[quotation.status] || quotation.status} color={statusColors[quotation.status] || 'default'} size="small" />
            {expired && <Chip label="Vencida" color="warning" size="small" variant="outlined" />}
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>{quotation.customer.name} · {quotation.device.brand} {quotation.device.model}</Typography>
        </Box>
        <Button variant="outlined" startIcon={<PictureAsPdfRoundedIcon />} onClick={() => generateQuotationPdf(quotation)}>Descargar PDF</Button>
      </Stack>
      {message.text && <Alert severity={message.type || 'info'}>{message.text}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <MainCard title="Falla reportada"><Typography>{quotation.issueDescription}</Typography></MainCard>
            <MainCard title="Conceptos">
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead><TableRow><TableCell>Descripción</TableCell><TableCell align="center">Cantidad</TableCell><TableCell align="right">Precio unitario</TableCell><TableCell align="right">Subtotal</TableCell></TableRow></TableHead>
                  <TableBody>
                    {quotation.items.map((item) => (
                      <TableRow key={item.id}><TableCell>{item.description}</TableCell><TableCell align="center">{item.quantity}</TableCell><TableCell align="right">{money(item.unitPrice)}</TableCell><TableCell align="right">{money(item.unitPrice * item.quantity)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" sx={{ justifyContent: 'flex-end' }}><Typography variant="h4">Total: {money(total)}</Typography></Stack>
            </MainCard>
            {quotation.notes && <MainCard title="Notas"><Typography>{quotation.notes}</Typography></MainCard>}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <MainCard title="Detalles">
              <Stack spacing={1.5}>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}><Typography color="text.secondary">Creada</Typography><Typography>{new Date(quotation.createdAt).toLocaleDateString('es-MX')}</Typography></Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}><Typography color="text.secondary">Válida hasta</Typography><Typography>{quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('es-MX') : '-'}</Typography></Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}><Typography color="text.secondary">Creada por</Typography><Typography>{quotation.createdBy?.name || '-'}</Typography></Stack>
                {quotation.serviceOrder && (
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}><Typography color="text.secondary">Orden generada</Typography><Button component={Link} to={`/service-orders/${quotation.serviceOrder.folio}`} sx={{ p: 0, minWidth: 0 }}>{quotation.serviceOrder.folio}</Button></Stack>
                )}
              </Stack>
            </MainCard>
            <MainCard title="Acciones">
              <Stack spacing={1.5}>
                {quotation.status === 'DRAFT' && <Button fullWidth variant="contained" startIcon={<ForwardToInboxRoundedIcon />} disabled={saving} onClick={() => changeStatus('SENT')}>Marcar como enviada</Button>}
                {quotation.status === 'SENT' && (
                  <>
                    <Button fullWidth variant="contained" color="success" startIcon={<CheckCircleRoundedIcon />} disabled={saving} onClick={() => changeStatus('APPROVED')}>Aprobada por el cliente</Button>
                    <Button fullWidth variant="outlined" color="error" startIcon={<HighlightOffRoundedIcon />} disabled={saving} onClick={() => changeStatus('REJECTED')}>Rechazada por el cliente</Button>
                  </>
                )}
                {quotation.status === 'APPROVED' && !quotation.serviceOrder && <Button fullWidth variant="contained" startIcon={<SyncAltRoundedIcon />} disabled={saving} onClick={convert}>Convertir a orden de servicio</Button>}
                {['REJECTED', 'CONVERTED'].includes(quotation.status) && (
                  <Typography color="text.secondary" variant="body2">Esta cotización ya no admite más acciones.</Typography>
                )}
              </Stack>
            </MainCard>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
