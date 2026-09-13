import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import OutlinedInput from '@mui/material/OutlinedInput';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';
import { api } from 'api/client';

// assets
import { IconSearch, IconX } from '@tabler/icons-react';

const statusLabel = (value) => (value || '').replaceAll('_', ' ');

function SearchResults({ results, loading, query, onNavigate }) {
  const hasResults = results && (results.customers.length || results.serviceOrders.length || results.inventory.length);

  if (loading) return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={22} /></Box>;
  if (!hasResults) return <Typography color="text.secondary" sx={{ p: 3 }}>Sin resultados para &quot;{query}&quot;.</Typography>;

  return (
    <List sx={{ maxHeight: 420, overflowY: 'auto', py: 0, width: '100%' }}>
      {results.customers.length > 0 && (
        <li>
          <ul style={{ padding: 0 }}>
            <ListSubheader>Clientes</ListSubheader>
            {results.customers.map((customer) => (
              <ListItemButton key={customer.id} onClick={() => onNavigate(`/customers/${customer.id}`)}>
                <ListItemText primary={customer.name} secondary={customer.phone} />
              </ListItemButton>
            ))}
          </ul>
        </li>
      )}
      {results.serviceOrders.length > 0 && (
        <li>
          <ul style={{ padding: 0 }}>
            <ListSubheader>Órdenes</ListSubheader>
            {results.serviceOrders.map((order) => (
              <ListItemButton key={order.folio} onClick={() => onNavigate(`/service-orders/${order.folio}`)}>
                <ListItemText primary={`${order.folio} · ${order.device.brand} ${order.device.model}`} secondary={`${order.customer.name} · ${statusLabel(order.status)}`} />
              </ListItemButton>
            ))}
          </ul>
        </li>
      )}
      {results.inventory.length > 0 && (
        <li>
          <ul style={{ padding: 0 }}>
            <ListSubheader>Inventario</ListSubheader>
            {results.inventory.map((item) => (
              <ListItemButton key={item.id} onClick={() => onNavigate(`/inventory?q=${encodeURIComponent(item.sku)}`)}>
                <ListItemText primary={item.name} secondary={`${item.sku} · ${item.stock} en stock`} />
              </ListItemButton>
            ))}
          </ul>
        </li>
      )}
    </List>
  );
}

// ==============================|| SEARCH INPUT ||============================== //

export default function SearchSection() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [value, setValue] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const anchorRef = useRef(null);

  const query = value.trim();
  const showDropdown = focused && query.length >= 2;

  useEffect(() => {
    if (!showDropdown) { setResults(null); return undefined; }
    setLoading(true);
    const timeout = window.setTimeout(() => {
      api.globalSearch(query).then(setResults).catch(() => setResults(null)).finally(() => setLoading(false));
    }, 300);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleNavigate = (path) => {
    setValue('');
    setResults(null);
    setMobileOpen(false);
    setFocused(false);
    navigate(path);
  };

  const endAdornment = value ? (
    <InputAdornment position="end">
      <IconButton size="small" onClick={() => setValue('')} aria-label="Limpiar búsqueda">
        <IconX stroke={1.5} size="16px" />
      </IconButton>
    </InputAdornment>
  ) : null;

  const dropdown = showDropdown && (
    <Popper open={showDropdown} anchorEl={anchorRef.current} placement="bottom-start" sx={{ zIndex: 1200, width: anchorRef.current?.offsetWidth || 320 }} modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}>
      <Transitions in={showDropdown} type="grow" position="top-left">
        <Paper>
          <MainCard border={false} elevation={16} content={false} boxShadow shadow={theme.shadows[16]}>
            <SearchResults results={results} loading={loading} query={query} onNavigate={handleNavigate} />
          </MainCard>
        </Paper>
      </Transitions>
    </Popper>
  );

  if (downMD) {
    return (
      <ClickAwayListener onClickAway={() => { setMobileOpen(false); setFocused(false); }}>
        <Box>
          {!mobileOpen ? (
            <Avatar
              variant="rounded"
              sx={{ ...theme.typography.commonAvatar, ...theme.typography.mediumAvatar, ml: 2, color: theme.vars.palette.secondary.dark, background: theme.vars.palette.secondary.light }}
              onClick={() => setMobileOpen(true)}
            >
              <IconSearch stroke={1.5} size="19.2px" />
            </Avatar>
          ) : (
            <Box sx={{ position: 'fixed', top: 10, left: 10, right: 10, zIndex: 1201 }}>
              <OutlinedInput
                inputRef={anchorRef}
                autoFocus
                fullWidth
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onFocus={() => setFocused(true)}
                placeholder="Buscar cliente, orden o pieza..."
                startAdornment={<InputAdornment position="start"><IconSearch stroke={1.5} size="16px" /></InputAdornment>}
                endAdornment={endAdornment}
                sx={{ bgcolor: 'background.paper' }}
              />
              {dropdown}
            </Box>
          )}
        </Box>
      </ClickAwayListener>
    );
  }

  return (
    <ClickAwayListener onClickAway={() => setFocused(false)}>
      <Box sx={{ ml: 2, width: { md: 250, lg: 434 } }}>
        <OutlinedInput
          inputRef={anchorRef}
          fullWidth
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Buscar cliente, orden o pieza..."
          startAdornment={<InputAdornment position="start"><IconSearch stroke={1.5} size="16px" /></InputAdornment>}
          endAdornment={endAdornment}
          sx={{ px: 2, bgcolor: 'background.paper' }}
        />
        {dropdown}
      </Box>
    </ClickAwayListener>
  );
}
