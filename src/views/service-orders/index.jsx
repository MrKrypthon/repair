import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const orders = [
  { folio: 'OS-1048', customer: 'María González', device: 'iPhone 12', issue: 'Pantalla rota', status: 'En reparación', tone: 'primary', priority: 'Alta', received: '07 Sep 2026' },
  { folio: 'OS-1047', customer: 'Carlos Ramírez', device: 'Samsung A52', issue: 'No carga', status: 'Esperando pieza', tone: 'warning', priority: 'Normal', received: '06 Sep 2026' },
  { folio: 'OS-1046', customer: 'Lucía Torres', device: 'MacBook Air', issue: 'No enciende', status: 'En diagnóstico', tone: 'info', priority: 'Alta', received: '06 Sep 2026' },
  { folio: 'OS-1045', customer: 'Diego Herrera', device: 'Nintendo Switch', issue: 'Falla HDMI', status: 'Listo para entrega', tone: 'success', priority: 'Normal', received: '05 Sep 2026' },
  { folio: 'OS-1044', customer: 'Ana Morales', device: 'iPad 9', issue: 'Batería', status: 'Esperando autorización', tone: 'secondary', priority: 'Normal', received: '04 Sep 2026' }
];

const NOT_OVERDUE_STATUSES = ['ENTREGADO', 'CANCELADO', 'SIN_REPARACION'];

export default function ServiceOrders() {
  const [searchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(searchParams.get('overdue') === '1');

  useEffect(() => {
    api.listServiceOrders().then(setRecords).catch(() => setError('No se pudo conectar con la API. Mostrando datos de ejemplo.')).finally(() => setLoading(false));
  }, []);

  const source = records.length ? records.map((order) => ({
    ...order,
    customer: order.customer.name,
    device: `${order.device.brand} ${order.device.model}`,
    issue: order.reportedIssue,
    status: order.status.replaceAll('_', ' '),
    tone: order.status === 'LISTO_ENTREGA' ? 'success' : order.status === 'ESPERA_PIEZA' ? 'warning' : 'primary',
    priority: order.priority,
    received: new Date(order.receivedAt).toLocaleDateString('es-MX'),
    overdue: Boolean(order.estimatedDeliveryAt) && new Date(order.estimatedDeliveryAt) < new Date() && !NOT_OVERDUE_STATUSES.includes(order.status)
  })) : orders;
  const filteredOrders = source.filter((order) => `${order.folio} ${order.customer} ${order.device} ${order.issue}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === 'ALL' || order.status.toLowerCase() === statusFilter.replaceAll('_', ' ').toLowerCase()) && (priorityFilter === 'ALL' || order.priority.toUpperCase() === priorityFilter) && (!overdueOnly || order.overdue));
  const exportCsv = () => {
    const header = ['Folio', 'Cliente', 'Equipo', 'Falla', 'Estado', 'Prioridad', 'Recepción'];
    const rows = filteredOrders.map((order) => [order.folio, order.customer, order.device, order.issue, order.status, order.priority, order.received]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ordenes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box><Typography variant="h2">Órdenes de servicio</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Seguimiento completo de cada reparación.</Typography></Box>
        <Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={exportCsv}>Exportar CSV</Button><Button component={Link} to="/service-orders/new" variant="contained" startIcon={<AddRoundedIcon />}>Nueva orden</Button></Stack>
      </Stack>
      <MainCard content={false}>
        {error && <Alert severity="warning" sx={{ m: 2.5, mb: 0 }}>{error}</Alert>}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2.5, justifyContent: 'space-between', alignItems: { md: 'center' } }}><Typography variant="h4">Todas las órdenes <Typography component="span" color="text.secondary" variant="body2">({filteredOrders.length})</Typography></Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}><TextField size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar orden, cliente o equipo" sx={{ minWidth: { sm: 250 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }} /><TextField select size="small" label="Estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} sx={{ minWidth: 170 }}><MenuItem value="ALL">Todos</MenuItem><MenuItem value="EN_REPARACION">En reparación</MenuItem><MenuItem value="EN_DIAGNOSTICO">En diagnóstico</MenuItem><MenuItem value="ESPERA_PIEZA">Esperando pieza</MenuItem><MenuItem value="LISTO_ENTREGA">Listo para entrega</MenuItem></TextField><TextField select size="small" label="Prioridad" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} sx={{ minWidth: 120 }}><MenuItem value="ALL">Todas</MenuItem><MenuItem value="ALTA">Alta</MenuItem><MenuItem value="NORMAL">Normal</MenuItem></TextField><ToggleButton size="small" value="overdue" selected={overdueOnly} onChange={() => setOverdueOnly((current) => !current)} color="error"><WarningAmberRoundedIcon fontSize="small" sx={{ mr: 0.5 }} />Atrasadas</ToggleButton><Button size="small" startIcon={<FilterListRoundedIcon />} onClick={() => { setQuery(''); setStatusFilter('ALL'); setPriorityFilter('ALL'); setOverdueOnly(false); }}>Limpiar</Button></Stack></Stack>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 820 }}>
            <TableHead><TableRow><TableCell>Folio</TableCell><TableCell>Cliente / equipo</TableCell><TableCell>Falla reportada</TableCell><TableCell>Estado</TableCell><TableCell>Prioridad</TableCell><TableCell>Recepción</TableCell></TableRow></TableHead>
            <TableBody>{loading ? <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} sx={{ my: 3 }} /></TableCell></TableRow> : filteredOrders.map((order) => <TableRow hover key={order.folio}><TableCell><Button component={Link} to={`/service-orders/${order.folio}`} sx={{ p: 0, minWidth: 0 }}>{order.folio}</Button></TableCell><TableCell><Typography fontWeight={600}>{order.customer}</Typography><Typography variant="caption" color="text.secondary">{order.device}</Typography></TableCell><TableCell>{order.issue}</TableCell><TableCell><Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}><Chip label={order.status} color={order.tone} size="small" variant="outlined" />{order.overdue && <Chip label="Atrasada" color="error" size="small" icon={<WarningAmberRoundedIcon fontSize="small" />} />}</Stack></TableCell><TableCell><Chip label={order.priority} size="small" color={order.priority === 'Alta' ? 'error' : 'default'} /></TableCell><TableCell>{order.received}</TableCell></TableRow>)}</TableBody>
          </Table>
        </Box>
      </MainCard>
    </Stack>
  );
}
