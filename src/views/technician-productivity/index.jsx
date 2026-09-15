import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';

import EngineeringRoundedIcon from '@mui/icons-material/EngineeringRounded';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
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
import { api } from 'api/client';

const money = (value) => `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

function periodRange(period) {
  const now = new Date();
  if (period === 'month') return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() };
  if (period === 'year') return { from: new Date(now.getFullYear(), 0, 1).toISOString() };
  return {};
}

export default function TechnicianProductivity() {
  const isAdmin = JSON.parse(localStorage.getItem('fixtrack-user') || '{}').role === 'ADMIN';
  const theme = useTheme();
  const [period, setPeriod] = useState('month');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    const { from, to } = periodRange(period);
    api
      .getTechnicianReport(from, to)
      .then((data) => {
        setRows(data);
        setError('');
      })
      .catch(() => setError('No se pudo cargar el reporte de productividad.'))
      .finally(() => setLoading(false));
  }, [period, isAdmin]);

  const chartOptions = useMemo(() => {
    const primary = theme.palette.primary.main;
    const textMuted = theme.palette.text.secondary;
    const gridColor = theme.palette.divider;
    return {
      chart: { type: 'bar', toolbar: { show: false }, fontFamily: theme.typography.fontFamily },
      plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
      colors: [primary],
      dataLabels: { enabled: false },
      grid: { borderColor: gridColor, strokeDashArray: 4 },
      xaxis: {
        categories: rows?.map((row) => row.name) || [],
        labels: { style: { colors: textMuted } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: { labels: { style: { colors: textMuted } }, allowDecimals: false },
      tooltip: { theme: theme.palette.mode }
    };
  }, [theme, rows]);

  const chartSeries = rows ? [{ name: 'Órdenes cerradas', data: rows.map((row) => row.closedOrders) }] : [];

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h2">Productividad por técnico</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Órdenes cerradas, tiempo promedio de reparación y ganancia generada.
          </Typography>
        </Box>
        <ToggleButtonGroup exclusive size="small" value={period} onChange={(event, value) => value && setPeriod(value)}>
          <ToggleButton value="month">Este mes</ToggleButton>
          <ToggleButton value="year">Este año</ToggleButton>
          <ToggleButton value="all">Todo</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {error && <Alert severity="warning">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !rows || rows.length === 0 ? (
        <MainCard>
          <Stack spacing={1.5} sx={{ alignItems: 'center', py: 4 }}>
            <EngineeringRoundedIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
            <Typography color="text.secondary">No hay técnicos registrados todavía.</Typography>
          </Stack>
        </MainCard>
      ) : (
        <>
          <MainCard title="Órdenes cerradas por técnico">
            <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height={280} />
          </MainCard>

          <MainCard title="Detalle por técnico">
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Técnico</TableCell>
                    <TableCell align="right">Órdenes cerradas</TableCell>
                    <TableCell align="right">Órdenes activas</TableCell>
                    <TableCell align="right">Tiempo promedio</TableCell>
                    <TableCell align="right">Ingresos generados</TableCell>
                    <TableCell align="right">Ganancia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow hover key={row.id} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 32, height: 32, fontSize: '0.85rem' }}>
                            {row.name
                              .split(' ')
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join('')}
                          </Avatar>
                          <Typography fontWeight={600}>{row.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{row.closedOrders}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={row.activeOrders}
                          size="small"
                          color={row.activeOrders > 0 ? 'primary' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{row.closedOrders > 0 ? `${row.avgRepairDays.toFixed(1)} días` : '—'}</TableCell>
                      <TableCell align="right">{money(row.revenue)}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600} color={row.profit >= 0 ? 'success.dark' : 'error.main'}>
                          {money(row.profit)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </MainCard>
        </>
      )}
    </Stack>
  );
}
