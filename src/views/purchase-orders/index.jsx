import { useEffect, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import ConfirmDialog from 'ui-component/ConfirmDialog';
import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const emptyDraft = { inventoryItemId: '', quantity: 1, unitCost: '' };

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [lines, setLines] = useState([]);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = () =>
    api
      .listPurchaseOrders()
      .then(setOrders)
      .catch(() => setError('No se pudieron cargar las órdenes de compra.'))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
    api
      .listSuppliers()
      .then(setSuppliers)
      .catch(() => {});
    api
      .listInventory()
      .then(setItems)
      .catch(() => {});
  }, []);

  const addLine = () => {
    if (!draft.inventoryItemId || !draft.quantity || !draft.unitCost) return;
    const item = items.find((candidate) => candidate.id === draft.inventoryItemId);
    setLines([
      ...lines,
      { ...draft, quantity: Number(draft.quantity), unitCost: Number(draft.unitCost), name: item?.name || draft.inventoryItemId }
    ]);
    setDraft(emptyDraft);
  };

  const create = (event) => {
    event.preventDefault();
    if (!supplierId || !lines.length) return;
    setCreating(true);
    api
      .createPurchaseOrder({
        supplierId,
        notes,
        lines: lines.map(({ inventoryItemId, quantity, unitCost }) => ({ inventoryItemId, quantity, unitCost }))
      })
      .then(() => {
        setOpen(false);
        setSupplierId('');
        setNotes('');
        setLines([]);
        return load();
      })
      .catch(() => setError('No se pudo crear la orden de compra.'))
      .finally(() => setCreating(false));
  };

  const receive = (id) =>
    api
      .receivePurchaseOrder(id)
      .then(load)
      .catch(() => setError('No se pudo recibir la orden de compra.'));
  const sendOrder = (id) =>
    api
      .orderPurchaseOrder(id)
      .then(load)
      .catch(() => setError('No se pudo marcar la orden como enviada.'));
  const cancel = (id) =>
    api
      .cancelPurchaseOrder(id)
      .then(load)
      .catch(() => setError('No se pudo cancelar la orden.'));

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h2">Órdenes de compra</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Reposición de piezas y consumibles del taller.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>
          Nueva orden
        </Button>
      </Stack>
      {error && <Alert severity="warning">{error}</Alert>}
      <MainCard title="Historial de compras">
        <Stack spacing={1.5}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : orders.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              Todavía no hay órdenes de compra registradas.
            </Typography>
          ) : (
            orders.map((order) => (
            <Stack
              direction="row"
              spacing={2}
              key={order.id}
              sx={{ alignItems: 'center', p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <ShoppingCartRoundedIcon color="primary" />
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={600}>{order.folio}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.supplier.name} · {order.lines.length} piezas
                </Typography>
              </Box>
              <Chip label={order.status} size="small" variant="outlined" />
              {order.status === 'DRAFT' && (
                <Button size="small" onClick={() => sendOrder(order.id)}>
                  Ordenar
                </Button>
              )}
              {order.status === 'ORDERED' && (
                <Button size="small" onClick={() => receive(order.id)}>
                  Recibir
                </Button>
              )}
              {(order.status === 'DRAFT' || order.status === 'ORDERED') && (
                <Button size="small" color="error" onClick={() => setOrderToCancel(order)}>
                  Cancelar
                </Button>
              )}
            </Stack>
            ))
          )}
        </Stack>
      </MainCard>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Nueva orden de compra</DialogTitle>
        <Stack component="form" onSubmit={create}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                required
                select
                fullWidth
                label="Proveedor"
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </TextField>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  select
                  fullWidth
                  label="Pieza"
                  value={draft.inventoryItemId}
                  onChange={(event) => {
                    const item = items.find((candidate) => candidate.id === event.target.value);
                    setDraft({ ...draft, inventoryItemId: event.target.value, unitCost: item ? item.cost : draft.unitCost });
                  }}
                >
                  {items.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} · {item.sku}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  type="number"
                  label="Cantidad"
                  value={draft.quantity}
                  onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
                  inputProps={{ min: 1 }}
                />
                <TextField
                  type="number"
                  label="Costo unitario"
                  value={draft.unitCost}
                  onChange={(event) => setDraft({ ...draft, unitCost: event.target.value })}
                  inputProps={{ min: 0, step: '0.01' }}
                />
                <Button variant="outlined" onClick={addLine}>
                  Agregar
                </Button>
              </Stack>
              {lines.map((line, index) => (
                <Stack
                  direction="row"
                  key={`${line.inventoryItemId}-${index}`}
                  sx={{ justifyContent: 'space-between', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}
                >
                  <Typography>
                    {line.name} × {line.quantity}
                  </Typography>
                  <Typography>${(line.quantity * line.unitCost).toLocaleString('es-MX')}</Typography>
                </Stack>
              ))}
              <TextField fullWidth label="Notas" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={!supplierId || !lines.length || creating}>
              {creating ? 'Creando...' : 'Crear orden'}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
      <ConfirmDialog
        open={Boolean(orderToCancel)}
        title="Cancelar orden de compra"
        description={`¿Cancelar la orden ${orderToCancel?.folio || ''} a ${orderToCancel?.supplier?.name || 'este proveedor'}? Esta acción no se puede deshacer.`}
        confirmLabel="Cancelar orden"
        onConfirm={() => cancel(orderToCancel.id)}
        onClose={() => setOrderToCancel(null)}
      />
    </Stack>
  );
}
