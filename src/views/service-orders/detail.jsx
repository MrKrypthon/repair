import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import DeviceHubRoundedIcon from '@mui/icons-material/DeviceHubRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';
import { activeStepIndex, journeySteps } from 'utils/serviceOrderJourney';
import { generateOrderPdf } from 'utils/generateOrderPdf';

const statuses = [
  ['RECIBIDO', 'Recibido'],
  ['ESPERA_DIAGNOSTICO', 'En espera de diagnóstico'],
  ['EN_DIAGNOSTICO', 'En diagnóstico'],
  ['ESPERA_AUTORIZACION', 'Esperando autorización'],
  ['ESPERA_PIEZA', 'Esperando pieza'],
  ['EN_REPARACION', 'En reparación'],
  ['EN_PRUEBAS', 'En pruebas'],
  ['LISTO_ENTREGA', 'Listo para entrega'],
  ['ENTREGADO', 'Entregado'],
  ['CANCELADO', 'Cancelado'],
  ['SIN_REPARACION', 'Sin reparación']
];

const testOptions = ['Encendido', 'Carga', 'Pantalla', 'Cámaras', 'Audio', 'Red', 'Wi-Fi', 'Bluetooth'];

const statusLabel = (value) => statuses.find(([key]) => key === value)?.[1] || value;

export default function ServiceOrderDetail() {
  const { orderId } = useParams();
  const isTechnician = JSON.parse(localStorage.getItem('fixtrack-user') || '{}').role === 'TECHNICIAN';
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [payment, setPayment] = useState({ amount: '', method: 'CASH', type: 'DEPOSIT', reference: '' });
  const [savingPayment, setSavingPayment] = useState(false);
  const [budget, setBudget] = useState({ partsCost: '', laborCost: '', otherCharges: '', finalCost: '', budgetStatus: 'PENDING' });
  const [savingBudget, setSavingBudget] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [part, setPart] = useState({ inventoryItemId: '', quantity: 1 });
  const [savingPart, setSavingPart] = useState(false);
  const [diagnosis, setDiagnosis] = useState({ diagnosis: '', probableCause: '', testChecklist: {} });
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [trackingCopied, setTrackingCopied] = useState(false);
  const [technicalNote, setTechnicalNote] = useState({ title: '', content: '', measurements: '' });
  const [savingNote, setSavingNote] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [technicianId, setTechnicianId] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [orderEdit, setOrderEdit] = useState({ reportedIssue: '', priority: 'NORMAL', estimatedDeliveryAt: '', device: { category: 'CELULAR', brand: '', model: '', serialNumber: '', imei: '', color: '' } });
  const [savingOrderEdit, setSavingOrderEdit] = useState(false);

  const loadOrder = () => api.getServiceOrder(orderId).then((data) => { setOrder(data); setStatus(data.status); setTechnicianId(data.assignedTechnicianId || ''); setBudget({ partsCost: data.partsCost || '', laborCost: data.laborCost || '', otherCharges: data.otherCharges || '', finalCost: data.finalCost || '', budgetStatus: data.budgetStatus || 'PENDING' }); setDiagnosis({ diagnosis: data.diagnosis || '', probableCause: data.probableCause || '', testChecklist: data.testChecklist || {} }); setOrderEdit({ reportedIssue: data.reportedIssue || '', priority: data.priority || 'NORMAL', estimatedDeliveryAt: data.estimatedDeliveryAt ? data.estimatedDeliveryAt.slice(0, 16) : '', device: { category: data.device.category, brand: data.device.brand || '', model: data.device.model || '', serialNumber: data.device.serialNumber || '', imei: data.device.imei || '', color: data.device.color || '' } }); }).catch(() => setMessage({ type: 'error', text: 'No se pudo cargar la orden.' })).finally(() => setLoading(false));

  useEffect(() => { loadOrder(); }, [orderId]);
  useEffect(() => { api.listInventory().then(setInventory).catch(() => {}); }, []);
  useEffect(() => { api.listTechnicians().then(setTechnicians).catch(() => {}); }, []);

  const saveStatus = () => {
    setSaving(true);
    api.updateServiceOrderStatus(orderId, { status, note }).then(() => { setMessage({ type: 'success', text: 'Estado actualizado y registrado en el historial.' }); setNote(''); return loadOrder(); }).catch(() => setMessage({ type: 'error', text: 'No se pudo actualizar el estado.' })).finally(() => setSaving(false));
  };

  const savePayment = () => {
    setSavingPayment(true);
    api.createPayment(orderId, { ...payment, amount: Number(payment.amount) }).then(() => { setMessage({ type: 'success', text: 'Pago registrado correctamente.' }); setPayment({ amount: '', method: 'CASH', type: 'DEPOSIT', reference: '' }); return loadOrder(); }).catch(() => setMessage({ type: 'error', text: 'No se pudo registrar el pago.' })).finally(() => setSavingPayment(false));
  };

  const saveBudget = () => {
    setSavingBudget(true);
    api.updateServiceOrderBudget(orderId, { ...budget, partsCost: Number(budget.partsCost || 0), laborCost: Number(budget.laborCost || 0), otherCharges: Number(budget.otherCharges || 0), finalCost: budget.finalCost === '' ? undefined : Number(budget.finalCost) }).then(() => { setMessage({ type: 'success', text: 'Presupuesto actualizado correctamente.' }); return loadOrder(); }).catch(() => setMessage({ type: 'error', text: 'No se pudo actualizar el presupuesto.' })).finally(() => setSavingBudget(false));
  };

  const savePart = () => {
    setSavingPart(true);
    api.addOrderPart(orderId, { inventoryItemId: part.inventoryItemId, quantity: Number(part.quantity) }).then(() => { setMessage({ type: 'success', text: 'Pieza agregada y descontada del inventario.' }); setPart({ inventoryItemId: '', quantity: 1 }); return loadOrder(); }).catch(() => setMessage({ type: 'error', text: 'No se pudo consumir la pieza. Revisa la existencia disponible.' })).finally(() => setSavingPart(false));
  };

  const saveDiagnosis = () => {
    setSavingDiagnosis(true);
    api.updateDiagnosis(orderId, diagnosis).then(() => { setMessage({ type: 'success', text: 'Diagnóstico guardado correctamente.' }); return loadOrder(); }).catch(() => setMessage({ type: 'error', text: 'No se pudo guardar el diagnóstico.' })).finally(() => setSavingDiagnosis(false));
  };

  const saveNote = () => {
    setSavingNote(true);
    api.addTechnicalNote(orderId, technicalNote).then(() => { setMessage({ type: 'success', text: 'Nota técnica guardada.' }); setTechnicalNote({ title: '', content: '', measurements: '' }); return loadOrder(); }).catch(() => setMessage({ type: 'error', text: 'No se pudo guardar la nota técnica.' })).finally(() => setSavingNote(false));
  };

  const saveTechnician = () => api.assignTechnician(orderId, technicianId).then(() => { setMessage({ type: 'success', text: 'Técnico asignado correctamente.' }); return loadOrder(); }).catch(() => setMessage({ type: 'error', text: 'No se pudo asignar el técnico.' }));

  const saveOrderEdit = () => {
    setSavingOrderEdit(true);
    api.updateServiceOrder(orderId, { reportedIssue: orderEdit.reportedIssue, priority: orderEdit.priority, estimatedDeliveryAt: orderEdit.estimatedDeliveryAt || undefined, device: orderEdit.device }).then(() => { setMessage({ type: 'success', text: 'Orden actualizada correctamente.' }); return loadOrder(); }).catch(() => setMessage({ type: 'error', text: 'No se pudo actualizar la orden.' })).finally(() => setSavingOrderEdit(false));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    api.addOrderAttachment(orderId, file).then(() => { setMessage({ type: 'success', text: 'Archivo subido correctamente.' }); return loadOrder(); }).catch(() => setMessage({ type: 'error', text: 'No se pudo subir el archivo. Usa JPG, PNG, WEBP o PDF de hasta 10MB.' })).finally(() => setUploading(false));
  };

  const deleteAttachment = (attachmentId) => {
    api.deleteOrderAttachment(orderId, attachmentId).then(() => { setMessage({ type: 'success', text: 'Archivo eliminado.' }); return loadOrder(); }).catch(() => setMessage({ type: 'error', text: 'No se pudo eliminar el archivo.' }));
  };

  const deliver = () => {
    setDelivering(true);
    api.deliverServiceOrder(orderId).then(() => { setMessage({ type: 'success', text: 'Orden entregada y cerrada correctamente.' }); return loadOrder(); }).catch(() => setMessage({ type: 'error', text: 'La orden debe estar lista para entrega.' })).finally(() => setDelivering(false));
  };

  const trackingUrl = `${window.location.origin}/tracking/${order?.publicTrackingToken || ''}`;
  const copyTracking = () => navigator.clipboard?.writeText(trackingUrl).then(() => { setTrackingCopied(true); window.setTimeout(() => setTrackingCopied(false), 1800); });

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!order) return <Alert severity="error">La orden no existe o no está disponible.</Alert>;

  const totalPaid = order.payments?.reduce((total, item) => total + Number(item.amount), 0) || 0;
  const balance = Math.max(0, Number(order.finalCost || order.estimatedCost || 0) - totalPaid);
  const photos = order.attachments?.filter((item) => item.category === 'PHOTO') || [];
  const documents = order.attachments?.filter((item) => item.category === 'DOCUMENT') || [];

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Button component={Link} to="/service-orders" startIcon={<ArrowBackRoundedIcon />}>Órdenes</Button><Typography color="text.secondary">/ {order.folio}</Typography></Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}><Box><Typography variant="h2">Orden {order.folio}</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Recibida el {new Date(order.receivedAt).toLocaleString('es-MX')}{order.estimatedDeliveryAt ? ` · Entrega estimada: ${new Date(order.estimatedDeliveryAt).toLocaleDateString('es-MX')}` : ''}</Typography></Box><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Chip label={statusLabel(order.status)} color="primary" /><Button variant="outlined" startIcon={<PictureAsPdfRoundedIcon />} onClick={() => generateOrderPdf(order)}>Descargar PDF</Button>{order.status === 'LISTO_ENTREGA' && <Button variant="contained" color="success" startIcon={<LocalShippingRoundedIcon />} onClick={deliver} disabled={delivering}>{delivering ? 'Cerrando...' : 'Marcar entregado'}</Button>}</Stack></Stack>
      {order.status !== 'CANCELADO' && order.status !== 'SIN_REPARACION' && (
        <MainCard content={false}>
          <Box sx={{ p: 2.5, overflowX: 'auto' }}>
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
        </MainCard>
      )}
      {message.text && <Alert severity={message.type}>{message.text}</Alert>}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={3}>
            <MainCard title="Equipo y cliente">
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5}>
                  <DeviceHubRoundedIcon color="primary" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Cliente</Typography>
                    <Typography variant="h4">{order.customer.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{order.customer.phone}</Typography>
                  </Box>
                </Stack>
                <Divider />
                <Typography variant="subtitle1">Datos del equipo</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField select fullWidth label="Tipo de equipo" value={orderEdit.device.category} onChange={(event) => setOrderEdit({ ...orderEdit, device: { ...orderEdit.device, category: event.target.value } })}><MenuItem value="CELULAR">Celular</MenuItem><MenuItem value="TABLET">Tablet</MenuItem><MenuItem value="LAPTOP">Laptop</MenuItem><MenuItem value="CONSOLA">Consola</MenuItem><MenuItem value="OTRO">Otro</MenuItem></TextField></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Color" value={orderEdit.device.color} onChange={(event) => setOrderEdit({ ...orderEdit, device: { ...orderEdit.device, color: event.target.value } })} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Marca" value={orderEdit.device.brand} onChange={(event) => setOrderEdit({ ...orderEdit, device: { ...orderEdit.device, brand: event.target.value } })} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Modelo" value={orderEdit.device.model} onChange={(event) => setOrderEdit({ ...orderEdit, device: { ...orderEdit.device, model: event.target.value } })} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Número de serie" value={orderEdit.device.serialNumber} onChange={(event) => setOrderEdit({ ...orderEdit, device: { ...orderEdit.device, serialNumber: event.target.value } })} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="IMEI" value={orderEdit.device.imei} onChange={(event) => setOrderEdit({ ...orderEdit, device: { ...orderEdit.device, imei: event.target.value } })} /></Grid>
                </Grid>
                <Typography variant="subtitle1">Falla y prioridad</Typography>
                <TextField fullWidth multiline minRows={3} label="Falla reportada" value={orderEdit.reportedIssue} onChange={(event) => setOrderEdit({ ...orderEdit, reportedIssue: event.target.value })} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField select fullWidth label="Prioridad" value={orderEdit.priority} onChange={(event) => setOrderEdit({ ...orderEdit, priority: event.target.value })}><MenuItem value="NORMAL">Normal</MenuItem><MenuItem value="ALTA">Alta</MenuItem><MenuItem value="URGENTE">Urgente</MenuItem></TextField></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth type="datetime-local" label="Entrega estimada" InputLabelProps={{ shrink: true }} value={orderEdit.estimatedDeliveryAt} onChange={(event) => setOrderEdit({ ...orderEdit, estimatedDeliveryAt: event.target.value })} /></Grid>
                </Grid>
                <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={saveOrderEdit} disabled={savingOrderEdit || !orderEdit.reportedIssue || !orderEdit.device.brand || !orderEdit.device.model} sx={{ alignSelf: 'flex-start' }}>{savingOrderEdit ? 'Guardando...' : 'Guardar cambios'}</Button>
              </Stack>
            </MainCard>
            <MainCard title="Fotos y documentos">
              <Stack spacing={2}>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={handleFileSelect} />
                <Button variant="outlined" startIcon={<AddPhotoAlternateRoundedIcon />} onClick={() => fileInputRef.current?.click()} disabled={uploading} sx={{ alignSelf: 'flex-start' }}>
                  {uploading ? 'Subiendo...' : 'Subir foto o documento'}
                </Button>
                {photos.length > 0 && (
                  <Grid container spacing={1.5}>
                    {photos.map((photo) => (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={photo.id}>
                        <Box sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                          <Box component="a" href={photo.url} target="_blank" rel="noreferrer">
                            <Box component="img" src={photo.url} alt={photo.fileName} sx={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                          </Box>
                          <IconButton size="small" onClick={() => deleteAttachment(photo.id)} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}>
                            <DeleteRoundedIcon fontSize="small" color="error" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
                {documents.length > 0 && (
                  <Stack spacing={1}>
                    {documents.map((doc) => (
                      <Stack direction="row" key={doc.id} spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', overflow: 'hidden' }}>
                          <InsertDriveFileRoundedIcon color="action" fontSize="small" />
                          <Typography variant="body2" component="a" href={doc.url} target="_blank" rel="noreferrer" sx={{ color: 'text.primary', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.fileName}
                          </Typography>
                        </Stack>
                        <IconButton size="small" onClick={() => deleteAttachment(doc.id)}>
                          <DeleteRoundedIcon fontSize="small" color="error" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                )}
                {photos.length === 0 && documents.length === 0 && (
                  <Typography variant="body2" color="text.secondary">Aún no hay fotos ni documentos adjuntos a esta orden.</Typography>
                )}
              </Stack>
            </MainCard>
            <MainCard title="Diagnóstico técnico">
              <Stack spacing={2}><TextField fullWidth multiline minRows={3} label="Diagnóstico" placeholder="Describe las pruebas y hallazgos..." value={diagnosis.diagnosis} onChange={(event) => setDiagnosis({ ...diagnosis, diagnosis: event.target.value })} /><TextField fullWidth label="Causa probable" value={diagnosis.probableCause} onChange={(event) => setDiagnosis({ ...diagnosis, probableCause: event.target.value })} /><Typography variant="subtitle1">Checklist de pruebas</Typography><Grid container>{testOptions.map((test) => <Grid size={{ xs: 6, sm: 3 }} key={test}><FormControlLabel control={<Checkbox checked={Boolean(diagnosis.testChecklist[test])} onChange={(event) => setDiagnosis({ ...diagnosis, testChecklist: { ...diagnosis.testChecklist, [test]: event.target.checked } })} />} label={test} /></Grid>)}</Grid><Button variant="contained" onClick={saveDiagnosis} disabled={savingDiagnosis}>{savingDiagnosis ? 'Guardando...' : 'Guardar diagnóstico'}</Button></Stack>
            </MainCard>
            <MainCard title="Notas y mediciones">
              <Stack spacing={2}><TextField fullWidth label="Título" value={technicalNote.title} onChange={(event) => setTechnicalNote({ ...technicalNote, title: event.target.value })} placeholder="Ej. Medición línea VPH_PWR" /><TextField fullWidth multiline minRows={3} label="Nota técnica" value={technicalNote.content} onChange={(event) => setTechnicalNote({ ...technicalNote, content: event.target.value })} /><TextField fullWidth multiline minRows={2} label="Mediciones" value={technicalNote.measurements} onChange={(event) => setTechnicalNote({ ...technicalNote, measurements: event.target.value })} placeholder="Línea: VPH_PWR · Esperado: 4.2V · Medido: 0V" /><Button variant="outlined" onClick={saveNote} disabled={savingNote || !technicalNote.title || !technicalNote.content}>{savingNote ? 'Guardando...' : 'Guardar nota'}</Button>{order.technicalNotes?.map((item) => <Box key={item.id} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}><Typography fontWeight={600}>{item.title}</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{item.content}</Typography>{item.measurements && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{item.measurements}</Typography>}</Box>)}</Stack>
            </MainCard>
            <MainCard title="Responsable técnico">
              <Stack direction="row" spacing={1.5}><TextField select fullWidth label="Técnico asignado" value={technicianId} onChange={(event) => setTechnicianId(event.target.value)}><MenuItem value="">Sin asignar</MenuItem>{technicians.map((technician) => <MenuItem key={technician.id} value={technician.id}>{technician.name}</MenuItem>)}</TextField><Button variant="contained" onClick={saveTechnician}>Guardar</Button></Stack>
            </MainCard>
            <MainCard title="Seguimiento para el cliente">
              <Stack spacing={1.5}><Typography variant="body2" color="text.secondary">Comparte este enlace para que el cliente consulte el estado sin iniciar sesión.</Typography><TextField fullWidth size="small" value={trackingUrl} InputProps={{ readOnly: true }} /><Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<ContentCopyRoundedIcon />} onClick={copyTracking}>{trackingCopied ? 'Copiado' : 'Copiar enlace'}</Button><Button component="a" href={trackingUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<OpenInNewRoundedIcon />}>Abrir</Button></Stack></Stack>
            </MainCard>
            <MainCard title="Historial de estados">
              <Stack spacing={2}>{order.statusHistory.map((event, index) => <Stack direction="row" spacing={1.5} key={event.id}><CheckCircleRoundedIcon color={index === order.statusHistory.length - 1 ? 'primary' : 'disabled'} fontSize="small" /><Box><Typography fontWeight={600}>{statusLabel(event.newStatus)}</Typography><Typography variant="body2" color="text.secondary">{event.note || 'Sin comentario'} · {new Date(event.createdAt).toLocaleString('es-MX')}</Typography></Box></Stack>)}</Stack>
            </MainCard>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={3}>
            <MainCard title="Presupuesto">
            <Stack spacing={2}><TextField fullWidth type="number" label="Piezas" value={budget.partsCost} onChange={(event) => setBudget({ ...budget, partsCost: event.target.value })} inputProps={{ min: 0, step: '0.01' }} /><TextField fullWidth type="number" label="Mano de obra" value={budget.laborCost} onChange={(event) => setBudget({ ...budget, laborCost: event.target.value })} inputProps={{ min: 0, step: '0.01' }} /><TextField fullWidth type="number" label="Otros cargos" value={budget.otherCharges} onChange={(event) => setBudget({ ...budget, otherCharges: event.target.value })} inputProps={{ min: 0, step: '0.01' }} /><TextField fullWidth type="number" label="Precio final" value={budget.finalCost} onChange={(event) => setBudget({ ...budget, finalCost: event.target.value })} inputProps={{ min: 0, step: '0.01' }} /><TextField select fullWidth label="Autorización" value={budget.budgetStatus} onChange={(event) => setBudget({ ...budget, budgetStatus: event.target.value })} disabled={isTechnician} helperText={isTechnician ? 'Solo administración o recepción pueden autorizar o rechazar el presupuesto.' : ''}><MenuItem value="PENDING">Pendiente</MenuItem><MenuItem value="APPROVED">Autorizado</MenuItem><MenuItem value="REJECTED">Rechazado</MenuItem></TextField><Divider /><Stack direction="row" sx={{ justifyContent: 'space-between' }}><Typography variant="h4">Total estimado</Typography><Typography variant="h3">${[budget.partsCost, budget.laborCost, budget.otherCharges].reduce((total, value) => total + Number(value || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Typography></Stack><Button variant="contained" onClick={saveBudget} disabled={savingBudget}>{savingBudget ? 'Guardando...' : 'Guardar presupuesto'}</Button></Stack>
          </MainCard>
          <MainCard title="Piezas utilizadas">
            <Stack spacing={2}><TextField select fullWidth label="Pieza" value={part.inventoryItemId} onChange={(event) => setPart({ ...part, inventoryItemId: event.target.value })}><MenuItem value="">Selecciona una pieza</MenuItem>{inventory.map((item) => <MenuItem key={item.id} value={item.id}>{item.name} · {item.stock} disponibles</MenuItem>)}</TextField><TextField fullWidth type="number" label="Cantidad" value={part.quantity} onChange={(event) => setPart({ ...part, quantity: event.target.value })} inputProps={{ min: 1, step: 1 }} /><Button variant="outlined" onClick={savePart} disabled={savingPart || !part.inventoryItemId}>{savingPart ? 'Guardando...' : 'Agregar pieza'}</Button>{order.parts?.length > 0 && <Stack spacing={1}>{order.parts.map((usedPart) => <Stack direction="row" key={usedPart.id} sx={{ justifyContent: 'space-between' }}><Typography variant="body2">{usedPart.inventoryItem.name} × {usedPart.quantity}</Typography><Typography variant="body2">${(Number(usedPart.unitPrice) * usedPart.quantity).toLocaleString('es-MX')}</Typography></Stack>)}</Stack>}</Stack>
          </MainCard>
          <MainCard title="Actualizar estado">
            <Stack spacing={2.5}><TextField select fullWidth label="Nuevo estado" value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField><TextField fullWidth multiline minRows={3} label="Comentario (opcional)" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Qué se realizó o qué queda pendiente..." /><Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={saveStatus} disabled={saving || status === order.status}>{saving ? 'Guardando...' : 'Guardar cambio'}</Button></Stack>
          </MainCard>
          <MainCard title="Cobros">
            <Stack spacing={2}><Stack direction="row" sx={{ justifyContent: 'space-between' }}><Typography color="text.secondary">Total cobrado</Typography><Typography variant="h3">${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Typography></Stack><Stack direction="row" sx={{ justifyContent: 'space-between' }}><Typography color="text.secondary">Saldo pendiente</Typography><Typography variant="h3" color={balance > 0 ? 'error.main' : 'success.main'}>${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Typography></Stack><Divider /><TextField fullWidth type="number" label="Importe" value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} inputProps={{ min: 0, step: '0.01' }} /><Stack direction="row" spacing={1}><TextField select fullWidth label="Tipo" value={payment.type} onChange={(event) => setPayment({ ...payment, type: event.target.value })}><MenuItem value="DEPOSIT">Anticipo</MenuItem><MenuItem value="PARTIAL">Pago parcial</MenuItem><MenuItem value="FINAL">Pago final</MenuItem></TextField><TextField select fullWidth label="Método" value={payment.method} onChange={(event) => setPayment({ ...payment, method: event.target.value })}><MenuItem value="CASH">Efectivo</MenuItem><MenuItem value="TRANSFER">Transferencia</MenuItem><MenuItem value="CARD">Tarjeta</MenuItem></TextField></Stack><TextField fullWidth label="Referencia (opcional)" value={payment.reference} onChange={(event) => setPayment({ ...payment, reference: event.target.value })} /><Button variant="contained" onClick={savePayment} disabled={savingPayment || !payment.amount}>{savingPayment ? 'Guardando...' : 'Registrar pago'}</Button></Stack>
            {order.payments?.length > 0 && <Stack spacing={1.5} sx={{ mt: 2.5 }}>{order.payments.map((item) => <Stack direction="row" key={item.id} sx={{ justifyContent: 'space-between' }}><Typography variant="body2">{item.type} · {item.method}</Typography><Typography variant="body2" fontWeight={600}>${Number(item.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Typography></Stack>)}</Stack>}
          </MainCard>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
