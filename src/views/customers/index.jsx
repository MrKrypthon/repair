import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const customers = [
  { name: 'María González', phone: '+52 55 1234 5678', email: 'maria@email.com', devices: 2, orders: 5, initials: 'MG' },
  { name: 'Carlos Ramírez', phone: '+52 55 9876 1122', email: 'carlos@email.com', devices: 1, orders: 2, initials: 'CR' },
  { name: 'Lucía Torres', phone: '+52 55 4455 6677', email: 'lucia@email.com', devices: 1, orders: 1, initials: 'LT' },
  { name: 'Diego Herrera', phone: '+52 55 3322 1100', email: 'diego@email.com', devices: 3, orders: 4, initials: 'DH' },
  { name: 'Ana Morales', phone: '+52 55 7788 9900', email: 'ana@email.com', devices: 1, orders: 3, initials: 'AM' }
];

export default function Customers() {
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listCustomers()
      .then(setRecords)
      .catch(() => setError('No se pudo conectar con el servidor. Mostrando datos de ejemplo mientras se restablece la conexión.'))
      .finally(() => setLoading(false));
  }, []);

  const source = error ? customers : records;
  const filteredCustomers = source.filter((customer) =>
    `${customer.name} ${customer.phone} ${customer.email || ''}`.toLowerCase().includes(query.toLowerCase())
  );
  const exportCsv = () => {
    const rows = [
      ['Nombre', 'Teléfono', 'Correo', 'Equipos', 'Órdenes'],
      ...filteredCustomers.map((customer) => [
        customer.name,
        customer.phone,
        customer.email || '',
        customer.devices?.length ?? customer.devices ?? 0,
        customer._count?.orders ?? customer.orders ?? 0
      ])
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h2">Clientes</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Personas y empresas que confían sus equipos al taller.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={exportCsv}>
            Exportar CSV
          </Button>
          <Button component={Link} to="/customers/new" variant="contained" startIcon={<AddRoundedIcon />}>
            Nuevo cliente
          </Button>
        </Stack>
      </Stack>
      <MainCard content={false}>
        {error && (
          <Alert severity="warning" sx={{ m: 2.5, mb: 0 }}>
            {error} Mostrando datos de ejemplo.
          </Alert>
        )}
        <Box sx={{ p: 2.5 }}>
          <TextField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, teléfono o correo"
            size="small"
            sx={{ width: { xs: '100%', sm: 360 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Equipos</TableCell>
                <TableCell>Órdenes</TableCell>
                <TableCell align="right">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} sx={{ my: 3 }} />
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      {query ? 'Ningún cliente coincide con la búsqueda.' : 'Todavía no hay clientes registrados.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow hover key={customer.email || customer.id}>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                          {customer.initials ||
                            customer.name
                              .split(' ')
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join('')}
                        </Avatar>
                        <Typography fontWeight={600}>{customer.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{customer.phone}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.email || 'Sin correo'}
                      </Typography>
                    </TableCell>
                    <TableCell>{customer.devices?.length ?? customer.devices ?? 0}</TableCell>
                    <TableCell>{customer._count?.orders ?? customer.orders ?? 0}</TableCell>
                    <TableCell align="right">
                      <Button component={Link} to={`/customers/${encodeURIComponent(customer.id || customer.name)}`} size="small">
                        Ver ficha
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </MainCard>
    </Stack>
  );
}
