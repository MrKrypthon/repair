import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';

import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import { api } from 'api/client';

const money = (value) => `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

function periodRange(period) {
  const now = new Date();
  if (period === 'month') return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() };
  if (period === 'year') return { from: new Date(now.getFullYear(), 0, 1).toISOString() };
  return {};
}

function SummaryCard({ icon: Icon, label, value, color, bg, detail, to }) {
  return (
    <MainCard content={false} sx={{ height: '100%' }} {...(to ? { component: Link, to } : {})}>
      <Stack direction="row" spacing={2} sx={{ p: 2.5, alignItems: 'center' }}>
        <Avatar variant="rounded" sx={{ bgcolor: bg, color, width: 48, height: 48 }}>
          <Icon />
        </Avatar>
        <Box>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h2" sx={{ my: 0.5, color: 'text.primary' }}>{value}</Typography>
          {detail && <Typography variant="caption" color={color}>{detail}</Typography>}
        </Box>
      </Stack>
    </MainCard>
  );
}

export default function Finance() {
  const isAdmin = JSON.parse(localStorage.getItem('fixtrack-user') || '{}').role === 'ADMIN';
  const theme = useTheme();
  const [period, setPeriod] = useState('month');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    const { from, to } = periodRange(period);
    api.getFinanceSummary(from, to).then((data) => { setSummary(data); setError(''); }).catch(() => setError('No se pudo cargar la información financiera.')).finally(() => setLoading(false));
  }, [period, isAdmin]);

  const chartOptions = useMemo(() => {
    const primary = theme.palette.primary.main;
    const error = theme.palette.error.main;
    const textMuted = theme.palette.text.secondary;
    const gridColor = theme.palette.divider;
    return {
      chart: { type: 'bar', toolbar: { show: false }, fontFamily: theme.typography.fontFamily, stacked: false },
      plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
      colors: [primary, error],
      dataLabels: { enabled: false },
      grid: { borderColor: gridColor, strokeDashArray: 4 },
      xaxis: { categories: summary?.monthly.map((m) => m.label) || [], labels: { style: { colors: textMuted } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: textMuted }, formatter: (value) => `$${Number(value).toLocaleString('es-MX')}` } },
      legend: { position: 'top', horizontalAlign: 'right', labels: { colors: textMuted } },
      tooltip: { theme: theme.palette.mode, y: { formatter: (value) => money(value) } }
    };
  }, [theme, summary]);

  const chartSeries = summary ? [{ name: 'Ingresos', data: summary.monthly.map((m) => m.income) }, { name: 'Gastos', data: summary.monthly.map((m) => m.expenses) }] : [];

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h2">Finanzas</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Ingresos, gastos y ganancia real del taller.</Typography>
        </Box>
        <ToggleButtonGroup exclusive size="small" value={period} onChange={(event, value) => value && setPeriod(value)}>
          <ToggleButton value="month">Este mes</ToggleButton>
          <ToggleButton value="year">Este año</ToggleButton>
          <ToggleButton value="all">Todo</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {error && <Alert severity="warning">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : summary ? (
        <>
          <Grid container spacing={gridSpacing}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <SummaryCard icon={PaymentsRoundedIcon} label="Ingresos" value={money(summary.income)} color="success.dark" bg="success.lighter" to="#movimientos" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <SummaryCard icon={ShoppingCartRoundedIcon} label="Gastos (piezas / proveedores)" value={money(summary.expenses)} color="error.main" bg="error.lighter" to="/purchase-orders" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <SummaryCard
                icon={summary.isProfit ? TrendingUpRoundedIcon : TrendingDownRoundedIcon}
                label="Ganancia neta"
                value={money(summary.netProfit)}
                color={summary.isProfit ? 'success.dark' : 'error.main'}
                bg={summary.isProfit ? 'success.lighter' : 'error.lighter'}
                detail={`Margen ${summary.margin.toFixed(1)}%`}
                to="#movimientos"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <MainCard content={false} sx={{ height: '100%' }}>
                <Stack spacing={1} sx={{ p: 2.5, alignItems: 'flex-start', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">Estado del periodo</Typography>
                  <Chip
                    icon={summary.isProfit ? <ArrowUpwardRoundedIcon /> : <ArrowDownwardRoundedIcon />}
                    label={summary.isProfit ? 'Números verdes · Ganancia' : 'Números rojos · Pérdida'}
                    color={summary.isProfit ? 'success' : 'error'}
                    sx={{
                      fontWeight: 600,
                      maxWidth: '100%',
                      height: 'auto',
                      '& .MuiChip-label': { whiteSpace: 'normal', display: 'block', py: 0.75 }
                    }}
                  />
                </Stack>
              </MainCard>
            </Grid>
          </Grid>

          <MainCard title="Ingresos vs. gastos (últimos 12 meses)">
            <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height={300} />
          </MainCard>

          <MainCard id="movimientos" title="Movimientos">
            {summary.movements.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No hay movimientos en este periodo.</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 640 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.movements.map((movement) => (
                      <TableRow hover key={movement.id} sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(movement.date).toLocaleString('es-MX')}</TableCell>
                        <TableCell>{movement.description}</TableCell>
                        <TableCell><Chip label={movement.type === 'INCOME' ? 'Ingreso' : 'Egreso'} color={movement.type === 'INCOME' ? 'success' : 'error'} size="small" variant="outlined" /></TableCell>
                        <TableCell align="right"><Typography fontWeight={600} color={movement.type === 'INCOME' ? 'success.dark' : 'error.main'}>{movement.type === 'INCOME' ? '+' : '-'}{money(movement.amount)}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </MainCard>
        </>
      ) : null}
    </Stack>
  );
}
