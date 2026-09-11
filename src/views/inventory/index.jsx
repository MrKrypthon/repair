import { useEffect, useState } from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const demoItems = [
  { id: 'demo-1', name: 'Pantalla iPhone 12 OLED', sku: 'SCR-IP12-OLED', category: 'Pantallas', cost: 1850, salePrice: 2800, stock: 3, minimumStock: 2 },
  { id: 'demo-2', name: 'Centro de carga Samsung A52', sku: 'CHG-SA52', category: 'Componentes', cost: 180, salePrice: 450, stock: 1, minimumStock: 3 },
  { id: 'demo-3', name: 'Adhesivo B-7000 15ml', sku: 'CON-B7000', category: 'Consumibles', cost: 55, salePrice: 120, stock: 12, minimumStock: 5 }
];

export default function Inventory() {
  const isTechnician = JSON.parse(localStorage.getItem('electronica-tech-user') || '{}').role === 'TECHNICIAN';
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [stockItem, setStockItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', sku: '', category: '', cost: '', salePrice: '', stock: 0, minimumStock: 0 });
  const [suppliers, setSuppliers] = useState([]);
  const [stockForm, setStockForm] = useState({ type: 'IN', quantity: 1, note: '' });

  useEffect(() => { api.listInventory().then(setItems).catch(() => setError('No se pudo conectar con la API. Mostrando inventario de ejemplo.')).finally(() => setLoading(false)); }, []);
  useEffect(() => { api.listSuppliers().then(setSuppliers).catch(() => {}); }, []);

  const source = items.length ? items : demoItems;
  const filtered = source.filter((item) => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  const lowStock = source.filter((item) => item.stock <= item.minimumStock).length;
  const reload = () => api.listInventory().then(setItems).catch(() => setError('No se pudo actualizar inventario.'));
  const createItem = (event) => { event.preventDefault(); api.createInventoryItem({ ...itemForm, cost: Number(itemForm.cost), salePrice: Number(itemForm.salePrice), stock: Number(itemForm.stock), minimumStock: Number(itemForm.minimumStock), supplierId: itemForm.supplierId || undefined }).then(() => { setNewItemOpen(false); setItemForm({ name: '', sku: '', category: '', cost: '', salePrice: '', stock: 0, minimumStock: 0, supplierId: '' }); return reload(); }).catch(() => setError('No se pudo crear la pieza.')); };
  const adjustStock = (event) => { event.preventDefault(); api.adjustInventory(stockItem.id, { ...stockForm, quantity: Number(stockForm.quantity) }).then(() => { setStockItem(null); return reload(); }).catch(() => setError('No se pudo ajustar el stock.')); };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}><Box><Typography variant="h2">Inventario</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Piezas, componentes y consumibles del taller.</Typography></Box>{!isTechnician && <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setNewItemOpen(true)}>Nueva pieza</Button>}</Stack>
      {error && <Alert severity="warning">{error}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><MainCard content={false} sx={{ flex: 1 }}><Stack direction="row" spacing={2} sx={{ p: 2.5, alignItems: 'center' }}><Avatar variant="rounded" sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}><Inventory2RoundedIcon /></Avatar><Box><Typography variant="body2" color="text.secondary">Productos registrados</Typography><Typography variant="h2">{source.length}</Typography></Box></Stack></MainCard><MainCard content={false} sx={{ flex: 1 }}><Stack direction="row" spacing={2} sx={{ p: 2.5, alignItems: 'center' }}><Avatar variant="rounded" sx={{ bgcolor: 'warning.lighter', color: 'warning.dark' }}><Inventory2RoundedIcon /></Avatar><Box><Typography variant="body2" color="text.secondary">Stock bajo</Typography><Typography variant="h2">{lowStock}</Typography></Box></Stack></MainCard></Stack>
      <MainCard content={false}><Box sx={{ p: 2.5 }}><TextField size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, SKU o categoría" sx={{ width: { xs: '100%', sm: 380 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }} /></Box><Box sx={{ overflowX: 'auto' }}><Table sx={{ minWidth: 960 }}><TableHead><TableRow><TableCell>Producto</TableCell><TableCell>Categoría</TableCell><TableCell>SKU</TableCell><TableCell>Proveedor</TableCell><TableCell>Costo</TableCell><TableCell>Precio sugerido</TableCell><TableCell>Existencia</TableCell><TableCell>Acción</TableCell></TableRow></TableHead><TableBody>{loading ? <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={24} sx={{ my: 3 }} /></TableCell></TableRow> : filtered.map((item) => <TableRow hover key={item.id}><TableCell><Typography fontWeight={600}>{item.name}</Typography></TableCell><TableCell>{item.category}</TableCell><TableCell>{item.sku}</TableCell><TableCell>{item.supplier?.name || 'Sin proveedor'}</TableCell><TableCell>${Number(item.cost).toLocaleString('es-MX')}</TableCell><TableCell>${Number(item.salePrice).toLocaleString('es-MX')}</TableCell><TableCell><Chip label={`${item.stock} unidades`} color={item.stock <= item.minimumStock ? 'warning' : 'success'} size="small" variant="outlined" /></TableCell><TableCell>{!isTechnician && <Button size="small" onClick={() => setStockItem(item)}>Ajustar</Button>}</TableCell></TableRow>)}</TableBody></Table></Box></MainCard>
      <Dialog open={newItemOpen} onClose={() => setNewItemOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Nueva pieza</DialogTitle><Stack component="form" onSubmit={createItem}><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField required fullWidth label="Nombre" value={itemForm.name} onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })} /><Stack direction="row" spacing={2}><TextField required fullWidth label="SKU" value={itemForm.sku} onChange={(event) => setItemForm({ ...itemForm, sku: event.target.value })} /><TextField required fullWidth label="Categoría" value={itemForm.category} onChange={(event) => setItemForm({ ...itemForm, category: event.target.value })} /></Stack><TextField select fullWidth label="Proveedor" value={itemForm.supplierId || ''} onChange={(event) => setItemForm({ ...itemForm, supplierId: event.target.value })}><MenuItem value="">Sin proveedor</MenuItem>{suppliers.map((supplier) => <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>)}</TextField><Stack direction="row" spacing={2}><TextField required type="number" fullWidth label="Costo" value={itemForm.cost} onChange={(event) => setItemForm({ ...itemForm, cost: event.target.value })} /><TextField required type="number" fullWidth label="Precio sugerido" value={itemForm.salePrice} onChange={(event) => setItemForm({ ...itemForm, salePrice: event.target.value })} /></Stack><Stack direction="row" spacing={2}><TextField type="number" fullWidth label="Stock inicial" value={itemForm.stock} onChange={(event) => setItemForm({ ...itemForm, stock: event.target.value })} /><TextField type="number" fullWidth label="Stock mínimo" value={itemForm.minimumStock} onChange={(event) => setItemForm({ ...itemForm, minimumStock: event.target.value })} /></Stack></Stack></DialogContent><DialogActions><Button onClick={() => setNewItemOpen(false)}>Cancelar</Button><Button type="submit" variant="contained">Guardar</Button></DialogActions></Stack></Dialog>
      <Dialog open={Boolean(stockItem)} onClose={() => setStockItem(null)} fullWidth maxWidth="xs"><DialogTitle>Ajustar stock</DialogTitle><Stack component="form" onSubmit={adjustStock}><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><Typography>{stockItem?.name}</Typography><TextField select fullWidth label="Movimiento" value={stockForm.type} onChange={(event) => setStockForm({ ...stockForm, type: event.target.value })}><MenuItem value="IN">Entrada</MenuItem><MenuItem value="OUT">Salida</MenuItem><MenuItem value="ADJUSTMENT">Ajuste positivo</MenuItem></TextField><TextField required type="number" fullWidth label="Cantidad" value={stockForm.quantity} onChange={(event) => setStockForm({ ...stockForm, quantity: event.target.value })} inputProps={{ min: 1 }} /><TextField fullWidth label="Nota" value={stockForm.note} onChange={(event) => setStockForm({ ...stockForm, note: event.target.value })} /></Stack></DialogContent><DialogActions><Button onClick={() => setStockItem(null)}>Cancelar</Button><Button type="submit" variant="contained">Aplicar</Button></DialogActions></Stack></Dialog>
    </Stack>
  );
}
