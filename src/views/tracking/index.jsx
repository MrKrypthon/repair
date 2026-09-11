import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { api } from 'api/client';
import { activeStepIndex, journeySteps } from 'utils/serviceOrderJourney';

const labels = { RECIBIDO: 'Recibido', ESPERA_DIAGNOSTICO: 'En espera de diagnóstico', EN_DIAGNOSTICO: 'En diagnóstico', ESPERA_AUTORIZACION: 'Esperando autorización', ESPERA_PIEZA: 'Esperando pieza', EN_REPARACION: 'En reparación', EN_PRUEBAS: 'En pruebas', LISTO_ENTREGA: 'Listo para entrega', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado', SIN_REPARACION: 'Sin reparación' };

const REFRESH_INTERVAL_MS = 25000;

export default function Tracking() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const loadedOnce = useRef(false);

  useEffect(() => {
    const load = () =>
      api
        .publicTracking(token)
        .then((data) => { setOrder(data); loadedOnce.current = true; })
        .catch(() => { if (!loadedOnce.current) setError(true); });

    load();
    const interval = window.setInterval(load, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [token]);

  const decideBudget = (budgetStatus) => { setSavingBudget(true); api.publicBudget(token, budgetStatus).then(() => setOrder((current) => ({ ...current, budgetStatus }))).finally(() => setSavingBudget(false)); };

  if (error) return <Card sx={{ maxWidth: 520, mx: 'auto', mt: 8 }}><CardContent><ErrorOutlineRoundedIcon color="error" sx={{ fontSize: 48 }} /><Typography variant="h2" sx={{ mt: 2 }}>Enlace no disponible</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Verifica el código de seguimiento con el taller.</Typography></CardContent></Card>;
  if (!order) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;

  const isTerminalOutcome = order.status === 'CANCELADO' || order.status === 'SIN_REPARACION';

  return (
    <Card sx={{ maxWidth: 720, mx: 'auto', mt: { xs: 3, md: 8 } }}>
      <CardContent sx={{ p: { xs: 3, md: 5 } }}>
        <Stack spacing={3.5}>
          <Box>
            <Typography color="primary" fontWeight={700} sx={{ letterSpacing: 1 }}>FIXTRACK</Typography>
            <Typography variant="h2" sx={{ mt: 1 }}>Seguimiento de reparación</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>Orden {order.folio} · {order.device.brand} {order.device.model}</Typography>
          </Box>

          {isTerminalOutcome ? (
            <Alert severity={order.status === 'CANCELADO' ? 'error' : 'warning'} icon={<CancelRoundedIcon />}>
              {order.status === 'CANCELADO' ? 'Esta orden fue cancelada.' : 'El equipo no tuvo reparación.'} Contacta al taller si tienes dudas.
            </Alert>
          ) : (
            <Box sx={{ overflowX: 'auto', pb: 1 }}>
              <Stepper activeStep={activeStepIndex(order.status)} alternativeLabel sx={{ minWidth: 560 }}>
                {journeySteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <Step key={step.label}>
                      <StepLabel StepIconComponent={() => <Icon color={index <= activeStepIndex(order.status) ? 'primary' : 'disabled'} />}>{step.label}</StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            </Box>
          )}

          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'primary.lighter' }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <BuildRoundedIcon color="primary" />
              <Box>
                <Typography variant="h3">{labels[order.status] || order.status}</Typography>
                {order.estimatedDeliveryAt && <Typography color="text.secondary">Entrega estimada: {new Date(order.estimatedDeliveryAt).toLocaleDateString('es-MX')}</Typography>}
              </Box>
            </Stack>
          </Box>

          {order.estimatedCost && (
            <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h4">Presupuesto estimado</Typography>
              <Typography variant="h2" sx={{ mt: 1 }}>${Number(order.estimatedCost).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Typography>
              {order.budgetStatus === 'PENDING' ? (
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button fullWidth variant="contained" onClick={() => decideBudget('APPROVED')} disabled={savingBudget}>Autorizar</Button>
                  <Button fullWidth variant="outlined" color="error" onClick={() => decideBudget('REJECTED')} disabled={savingBudget}>Rechazar</Button>
                </Stack>
              ) : (
                <Typography color={order.budgetStatus === 'APPROVED' ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>{order.budgetStatus === 'APPROVED' ? 'Presupuesto autorizado' : 'Presupuesto rechazado'}</Typography>
              )}
            </Box>
          )}

          {order.attachments?.length > 0 && (
            <Box>
              <Typography variant="h4" sx={{ mb: 1.5 }}>Fotos del equipo</Typography>
              <Grid container spacing={1.5}>
                {order.attachments.map((photo) => (
                  <Grid size={{ xs: 4, sm: 3 }} key={photo.id}>
                    <Box
                      component="img"
                      src={photo.url}
                      alt={photo.fileName}
                      onClick={() => setLightboxUrl(photo.url)}
                      sx={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 1, cursor: 'pointer', border: '1px solid', borderColor: 'divider' }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Box>
            <Typography variant="h4">Historial</Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {order.statusHistory.map((event, index) => (
                <Stack direction="row" spacing={1.5} key={`${event.createdAt}-${event.newStatus}`}>
                  <CheckCircleRoundedIcon color={index === order.statusHistory.length - 1 ? 'primary' : 'disabled'} fontSize="small" />
                  <Box>
                    <Typography fontWeight={600}>{labels[event.newStatus] || event.newStatus}</Typography>
                    <Typography variant="body2" color="text.secondary">{event.note || 'Actualización de reparación'} · {new Date(event.createdAt).toLocaleString('es-MX')}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Divider />
          <Typography variant="body2" color="text.secondary">Esta página se actualiza sola. Para más información, contacta directamente con el taller.</Typography>
        </Stack>
      </CardContent>

      {lightboxUrl && (
        <Box onClick={() => setLightboxUrl(null)} sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, zIndex: 1300, cursor: 'zoom-out' }}>
          <Box component="img" src={lightboxUrl} alt="Foto del equipo" sx={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 1 }} />
        </Box>
      )}
    </Card>
  );
}
