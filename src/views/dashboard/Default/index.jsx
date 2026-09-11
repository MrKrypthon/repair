import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';

import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DevicesOtherRoundedIcon from '@mui/icons-material/DevicesOtherRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import { api } from 'api/client';

const orders = [
  { folio: 'OS-1048', device: 'iPhone 12 · Pantalla', customer: 'María González', status: 'En reparación', tone: 'primary', date: 'Hoy, 09:32' },
  { folio: 'OS-1047', device: 'Samsung A52 · Carga', customer: 'Carlos Ramírez', status: 'Esperando pieza', tone: 'warning', date: 'Ayer, 16:10' },
  { folio: 'OS-1046', device: 'MacBook Air · No enciende', customer: 'Lucía Torres', status: 'En diagnóstico', tone: 'info', date: 'Ayer, 14:45' },
  { folio: 'OS-1045', device: 'Nintendo Switch · HDMI', customer: 'Diego Herrera', status: 'Listo para entrega', tone: 'success', date: 'Ayer, 11:20' }
];

const metrics = [
  { label: 'En reparación', value: '18', detail: '+3 esta semana', icon: BuildRoundedIcon, color: 'primary.main', bg: 'primary.lighter' },
  { label: 'Listos para entregar', value: '7', detail: '2 desde ayer', icon: CheckCircleRoundedIcon, color: 'success.dark', bg: 'success.lighter' },
  { label: 'Cobros pendientes', value: '$18,450', detail: '5 órdenes', icon: PaymentsRoundedIcon, color: 'warning.dark', bg: 'warning.lighter' },
  { label: 'Órdenes atrasadas', value: '3', detail: 'Requieren atención', icon: WarningAmberRoundedIcon, color: 'error.main', bg: 'error.lighter' }
];

const statusPresentation = {
  RECIBIDO: ['Recibido', 'default'], ESPERA_DIAGNOSTICO: ['En espera de diagnóstico', 'info'], EN_DIAGNOSTICO: ['En diagnóstico', 'info'], ESPERA_AUTORIZACION: ['Esperando autorización', 'secondary'], ESPERA_PIEZA: ['Esperando pieza', 'warning'], EN_REPARACION: ['En reparación', 'primary'], EN_PRUEBAS: ['En pruebas', 'primary'], LISTO_ENTREGA: ['Listo para entrega', 'success'], ENTREGADO: ['Entregado', 'success'], CANCELADO: ['Cancelado', 'error'], SIN_REPARACION: ['Sin reparación', 'error']
};

function MetricCard({ metric }) {
  const Icon = metric.icon;

  return (
    <MainCard content={false} sx={{ height: '100%' }}>
      <Stack direction="row" spacing={2} sx={{ p: 2.5, alignItems: 'center' }}>
        <Avatar variant="rounded" sx={{ bgcolor: metric.bg, color: metric.color, width: 48, height: 48 }}>
          <Icon />
        </Avatar>
        <Box>
          <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
          <Typography variant="h2" sx={{ my: 0.5 }}>{metric.value}</Typography>
          <Typography variant="caption" color={metric.color}>{metric.detail}</Typography>
        </Box>
      </Stack>
    </MainCard>
  );
}

function WorkshopCharts({ dashboard }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const success = theme.palette.success.main;
  const textMuted = theme.palette.text.secondary;
  const gridColor = theme.palette.divider;

  const common = { chart: { toolbar: { show: false }, fontFamily: theme.typography.fontFamily }, dataLabels: { enabled: false }, grid: { borderColor: gridColor, strokeDashArray: 4 }, xaxis: { labels: { style: { colors: textMuted } }, axisBorder: { show: false }, axisTicks: { show: false } }, yaxis: { labels: { style: { colors: textMuted } } }, tooltip: { theme: theme.palette.mode } };
  const volumeOptions = { ...common, chart: { ...common.chart, type: 'area' }, colors: [primary, secondary], stroke: { curve: 'smooth', width: 3 }, fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0.02 } }, xaxis: { ...common.xaxis, categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] } };
  const volumeSeries = [{ name: 'Recibidas', data: [4, 6, 5, 8, 7, 9, dashboard?.receivedToday || 4] }, { name: 'Entregadas', data: [2, 3, 4, 3, 5, 4, dashboard?.ready || 2] }];
  const statusOptions = { chart: { type: 'donut', fontFamily: theme.typography.fontFamily }, labels: ['En reparación', 'Diagnóstico', 'Esperando autorización', 'Listos'], colors: [primary, secondary, '#f59e0b', success], legend: { position: 'bottom', fontSize: '12px', labels: { colors: textMuted } }, dataLabels: { enabled: false }, stroke: { colors: [theme.palette.background.paper] }, plotOptions: { pie: { donut: { size: '72%', labels: { show: true, total: { show: true, label: 'Órdenes activas', color: textMuted, formatter: () => String((dashboard?.inRepair || 18) + (dashboard?.pendingAuthorization || 4) + (dashboard?.ready || 7)) } } } } } };
  const statusSeries = [dashboard?.inRepair || 18, 8, dashboard?.pendingAuthorization || 4, dashboard?.ready || 7];

  return <><Grid size={{ xs: 12, lg: 8 }}><MainCard title="Actividad del taller" secondary={<Chip label="Últimos 7 días" size="small" color="primary" variant="outlined" />}><ReactApexChart options={volumeOptions} series={volumeSeries} type="area" height={290} /></MainCard></Grid><Grid size={{ xs: 12, lg: 4 }}><MainCard title="Órdenes por estado"><ReactApexChart options={statusOptions} series={statusSeries} type="donut" height={290} /></MainCard></Grid></>;
}

export default function Dashboard() {
  const isTechnician = JSON.parse(localStorage.getItem('electronica-tech-user') || '{}').role === 'TECHNICIAN';
  const [dashboard, setDashboard] = useState(null);
  const [recentOrders, setRecentOrders] = useState(orders);
  const [error, setError] = useState('');
  useEffect(() => {
    if (isTechnician) return;
    api.getDashboardMetrics().then(setDashboard).catch(() => setError('Mostrando valores de ejemplo. No se pudo cargar la analítica.'));
    api.listServiceOrders().then((records) => setRecentOrders(records.slice(0, 5).map((order) => ({ folio: order.folio, device: `${order.device.brand} · ${order.device.model}`, customer: order.customer.name, status: statusPresentation[order.status]?.[0] || order.status, tone: statusPresentation[order.status]?.[1] || 'default', date: new Date(order.updatedAt || order.receivedAt).toLocaleDateString('es-MX') })))).catch(() => {});
  }, [isTechnician]);

  if (isTechnician) return <Navigate to="/service-orders" replace />;
  const currentMetrics = dashboard ? [
    { label: 'En reparación', value: dashboard.inRepair, detail: `${dashboard.receivedToday} recibidas hoy`, icon: BuildRoundedIcon, color: 'primary.main', bg: 'primary.lighter' },
    { label: 'Listos para entregar', value: dashboard.ready, detail: `${dashboard.pendingAuthorization} presupuestos pendientes`, icon: CheckCircleRoundedIcon, color: 'success.dark', bg: 'success.lighter' },
    { label: 'Cobros registrados', value: `$${Number(dashboard.totalCollected).toLocaleString('es-MX')}`, detail: `${dashboard.customers} clientes`, icon: PaymentsRoundedIcon, color: 'warning.dark', bg: 'warning.lighter' },
    { label: 'Ganancia estimada', value: `$${Number(dashboard.estimatedProfit).toLocaleString('es-MX')}`, detail: `Margen ${Number(dashboard.margin).toFixed(1)}%`, icon: PaymentsRoundedIcon, color: 'success.dark', bg: 'success.lighter' },
    { label: 'Órdenes atrasadas', value: dashboard.overdue, detail: `${dashboard.lowStock} productos con stock bajo`, icon: WarningAmberRoundedIcon, color: 'error.main', bg: 'error.lighter' }
  ] : metrics;

  return (
    <Grid container spacing={gridSpacing}>
      <Grid size={12}>
        {error && <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h2">Resumen del taller</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>Martes, 7 de septiembre de 2026 · Todo bajo control.</Typography>
          </Box>
          <Button component={Link} to="/service-orders/new" variant="contained" startIcon={<AddRoundedIcon />} sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
            Nueva orden
          </Button>
        </Stack>
      </Grid>

      {currentMetrics.map((metric) => (
        <Grid key={metric.label} size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard metric={metric} />
        </Grid>
      ))}

      <WorkshopCharts dashboard={dashboard} />

      <Grid size={{ xs: 12, lg: 8 }}>
        <MainCard
          title="Órdenes recientes"
          secondary={<Button component={Link} to="/service-orders" size="small" endIcon={<ArrowForwardRoundedIcon />}>Ver todas</Button>}
        >
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 620 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Orden</TableCell>
                  <TableCell>Equipo</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Actualización</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow hover key={order.folio} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell><Typography component={Link} to={`/service-orders/${order.folio}`} color="primary" fontWeight={600}>{order.folio}</Typography></TableCell>
                    <TableCell>{order.device}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell><Chip label={order.status} color={order.tone} size="small" variant="outlined" /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{order.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </MainCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <MainCard title="Acciones rápidas">
          <Stack spacing={1.25}>
            <Button component={Link} to="/customers/new" variant="outlined" startIcon={<DevicesOtherRoundedIcon />} fullWidth sx={{ justifyContent: 'flex-start', py: 1.25 }}>Registrar cliente y equipo</Button>
            <Button component={Link} to="/service-orders" variant="outlined" startIcon={<AccessTimeRoundedIcon />} fullWidth sx={{ justifyContent: 'flex-start', py: 1.25 }}>Revisar órdenes atrasadas</Button>
            <Button component={Link} to="/payments" variant="outlined" startIcon={<PaymentsRoundedIcon />} fullWidth sx={{ justifyContent: 'flex-start', py: 1.25 }}>Consultar cobros pendientes</Button>
          </Stack>
          <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'primary.lighter' }}>
            <Typography variant="subtitle1">Recepción del día</Typography>
            <Typography variant="h3" sx={{ mt: 0.5 }}>4 equipos</Typography>
            <Typography variant="body2" color="text.secondary">2 celulares · 1 laptop · 1 consola</Typography>
          </Box>
        </MainCard>
      </Grid>
    </Grid>
  );
}
