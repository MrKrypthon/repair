import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const demoItems = [
  { id: 'demo-1', name: 'Pantalla iPhone 12 OLED', sku: 'SCR-IP12-OLED', category: 'Pantallas', cost: 1850, salePrice: 2800, stock: 3, minimumStock: 2, imageUrl: null },
  { id: 'demo-2', name: 'Centro de carga Samsung A52', sku: 'CHG-SA52', category: 'Componentes', cost: 180, salePrice: 450, stock: 1, minimumStock: 3, imageUrl: null },
  { id: 'demo-3', name: 'Adhesivo B-7000 15ml', sku: 'CON-B7000', category: 'Consumibles', cost: 55, salePrice: 120, stock: 12, minimumStock: 5, imageUrl: null }
];

function ProductImageInput({ onSelect, children }) {
  const inputRef = useRef(null);
  return (
    <>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) onSelect(file); }} />
      <Box onClick={() => inputRef.current?.click()} sx={{ cursor: 'pointer' }}>{children}</Box>
    </>
  );
}

function ProductCard({ item, isTechnician, onAdjust, onImageSelect, onImageRemove }) {
  const lowStock = item.stock <= item.minimumStock;
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative' }}>
        {item.imageUrl ? (
          <CardMedia component="img" image={item.imageUrl} alt={item.name} sx={{ height: 160, objectFit: 'cover' }} />
        ) : (
          <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
            <Inventory2RoundedIcon sx={{ fontSize: 48, color: 'grey.400' }} />
          </Box>
        )}
        {!isTechnician && (
          <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 6, right: 6 }}>
            <ProductImageInput onSelect={(file) => onImageSelect(item.id, file)}>
              <IconButton size="small" sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}>
                <PhotoCameraRoundedIcon fontSize="small" />
              </IconButton>
            </ProductImageInput>
            {item.imageUrl && (
              <IconButton size="small" onClick={() => onImageRemove(item.id)} sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}>
                <DeleteRoundedIcon fontSize="small" color="error" />
              </IconButton>
            )}
          </Stack>
        )}
      </Box>
      <CardContent sx={{ flex: 1 }}>
        <Chip label={item.category} size="small" sx={{ mb: 1 }} />
        <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.3 }}>{item.name}</Typography>
        <Typography variant="caption" color="text.secondary">{item.sku}{item.supplier?.name ? ` · ${item.supplier.name}` : ''}</Typography>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mt: 1.5 }}>
          <Typography variant="h4">${Number(item.salePrice).toLocaleString('es-MX')}</Typography>
          <Chip label={`${item.stock} unidades`} color={lowStock ? 'warning' : 'success'} size="small" variant="outlined" />
        </Stack>
      </CardContent>
      {!isTechnician && (
        <CardActions>
          <Button size="small" fullWidth onClick={() => onAdjust(item)}>Ajustar stock</Button>
        </CardActions>
      )}
    </Card>
  );
}

export default function Inventory() {
  const isTechnician = JSON.parse(localStorage.getItem('fixtrack-user') || '{}').role === 'TECHNICIAN';
  const [items, setItems] = useState([]);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [stockItem, setStockItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', sku: '', category: '', cost: '', salePrice: '', stock: 0, minimumStock: 0 });
  const [newItemImage, setNewItemImage] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [stockForm, setStockForm] = useState({ type: 'IN', quantity: 1, note: '' });

  const load = (search) => api.listInventory(search).then((records) => { setItems(records); setError(''); }).catch(() => setError('No se pudo conectar con la API. Mostrando inventario de ejemplo.')).finally(() => setLoading(false));

  const isFirstRender = useRef(true);
  useEffect(() => { load(query); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api.listSuppliers().then(setSuppliers).catch(() => {}); }, []);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timeout = window.setTimeout(() => load(query), 300);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const source = items.length ? items : (query ? [] : demoItems);
  const categories = [...new Set(source.map((item) => item.category))];
  const filtered = category ? source.filter((item) => item.category === category) : source;
  const lowStock = source.filter((item) => item.stock <= item.minimumStock).length;

  const createItem = (event) => {
    event.preventDefault();
    api.createInventoryItem({ ...itemForm, cost: Number(itemForm.cost), salePrice: Number(itemForm.salePrice), stock: Number(itemForm.stock), minimumStock: Number(itemForm.minimumStock), supplierId: itemForm.supplierId || undefined })
      .then((created) => (newItemImage ? api.uploadInventoryImage(created.id, newItemImage) : null))
      .then(() => { setNewItemOpen(false); setItemForm({ name: '', sku: '', category: '', cost: '', salePrice: '', stock: 0, minimumStock: 0, supplierId: '' }); setNewItemImage(null); return load(query); })
      .catch(() => setError('No se pudo crear la pieza.'));
  };
  const adjustStock = (event) => { event.preventDefault(); api.adjustInventory(stockItem.id, { ...stockForm, quantity: Number(stockForm.quantity) }).then(() => { setStockItem(null); return load(query); }).catch(() => setError('No se pudo ajustar el stock.')); };
  const changeImage = (id, file) => api.uploadInventoryImage(id, file).then(() => load(query)).catch(() => setError('No se pudo subir la imagen.'));
  const removeImage = (id) => api.removeInventoryImage(id).then(() => load(query)).catch(() => setError('No se pudo eliminar la imagen.'));

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}><Box><Typography variant="h2">Inventario</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Piezas, componentes y consumibles del taller.</Typography></Box>{!isTechnician && <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setNewItemOpen(true)}>Nueva pieza</Button>}</Stack>
      {error && <Alert severity="warning">{error}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><MainCard content={false} sx={{ flex: 1 }}><Stack direction="row" spacing={2} sx={{ p: 2.5, alignItems: 'center' }}><Avatar variant="rounded" sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}><Inventory2RoundedIcon /></Avatar><Box><Typography variant="body2" color="text.secondary">Productos registrados</Typography><Typography variant="h2">{source.length}</Typography></Box></Stack></MainCard><MainCard content={false} sx={{ flex: 1 }}><Stack direction="row" spacing={2} sx={{ p: 2.5, alignItems: 'center' }}><Avatar variant="rounded" sx={{ bgcolor: 'warning.lighter', color: 'warning.dark' }}><Inventory2RoundedIcon /></Avatar><Box><Typography variant="body2" color="text.secondary">Stock bajo</Typography><Typography variant="h2">{lowStock}</Typography></Box></Stack></MainCard></Stack>

      <Stack spacing={1.5}>
        <TextField size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, SKU o categoría" sx={{ width: { xs: '100%', sm: 380 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }} />
        {categories.length > 1 && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip label="Todas" size="small" color={category === '' ? 'primary' : 'default'} variant={category === '' ? 'filled' : 'outlined'} onClick={() => setCategory('')} />
            {categories.map((cat) => <Chip key={cat} label={cat} size="small" color={category === cat ? 'primary' : 'default'} variant={category === cat ? 'filled' : 'outlined'} onClick={() => setCategory(cat)} />)}
          </Stack>
        )}
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <MainCard><Typography color="text.secondary" align="center" sx={{ py: 4 }}>No se encontraron piezas para esta búsqueda.</Typography></MainCard>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((item) => (
            <Grid key={item.id} size={{ xs: 6, sm: 4, md: 3 }}>
              <ProductCard item={item} isTechnician={isTechnician} onAdjust={setStockItem} onImageSelect={changeImage} onImageRemove={removeImage} />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={newItemOpen} onClose={() => setNewItemOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Nueva pieza</DialogTitle><Stack component="form" onSubmit={createItem}><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField required fullWidth label="Nombre" value={itemForm.name} onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })} /><Stack direction="row" spacing={2}><TextField required fullWidth label="SKU" value={itemForm.sku} onChange={(event) => setItemForm({ ...itemForm, sku: event.target.value })} /><TextField required fullWidth label="Categoría" value={itemForm.category} onChange={(event) => setItemForm({ ...itemForm, category: event.target.value })} /></Stack><TextField select fullWidth label="Proveedor" value={itemForm.supplierId || ''} onChange={(event) => setItemForm({ ...itemForm, supplierId: event.target.value })}><MenuItem value="">Sin proveedor</MenuItem>{suppliers.map((supplier) => <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>)}</TextField><Stack direction="row" spacing={2}><TextField required type="number" fullWidth label="Costo" value={itemForm.cost} onChange={(event) => setItemForm({ ...itemForm, cost: event.target.value })} /><TextField required type="number" fullWidth label="Precio sugerido" value={itemForm.salePrice} onChange={(event) => setItemForm({ ...itemForm, salePrice: event.target.value })} /></Stack><Stack direction="row" spacing={2}><TextField type="number" fullWidth label="Stock inicial" value={itemForm.stock} onChange={(event) => setItemForm({ ...itemForm, stock: event.target.value })} /><TextField type="number" fullWidth label="Stock mínimo" value={itemForm.minimumStock} onChange={(event) => setItemForm({ ...itemForm, minimumStock: event.target.value })} /></Stack><Button component="label" variant="outlined" startIcon={<PhotoCameraRoundedIcon />}>{newItemImage ? newItemImage.name : 'Agregar foto (opcional)'}<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => setNewItemImage(event.target.files?.[0] || null)} /></Button></Stack></DialogContent><DialogActions><Button onClick={() => setNewItemOpen(false)}>Cancelar</Button><Button type="submit" variant="contained">Guardar</Button></DialogActions></Stack></Dialog>
      <Dialog open={Boolean(stockItem)} onClose={() => setStockItem(null)} fullWidth maxWidth="xs"><DialogTitle>Ajustar stock</DialogTitle><Stack component="form" onSubmit={adjustStock}><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><Typography>{stockItem?.name}</Typography><TextField select fullWidth label="Movimiento" value={stockForm.type} onChange={(event) => setStockForm({ ...stockForm, type: event.target.value })}><MenuItem value="IN">Entrada</MenuItem><MenuItem value="OUT">Salida</MenuItem><MenuItem value="ADJUSTMENT">Ajuste positivo</MenuItem></TextField><TextField required type="number" fullWidth label="Cantidad" value={stockForm.quantity} onChange={(event) => setStockForm({ ...stockForm, quantity: event.target.value })} inputProps={{ min: 1 }} /><TextField fullWidth label="Nota" value={stockForm.note} onChange={(event) => setStockForm({ ...stockForm, note: event.target.value })} /></Stack></DialogContent><DialogActions><Button onClick={() => setStockItem(null)}>Cancelar</Button><Button type="submit" variant="contained">Aplicar</Button></DialogActions></Stack></Dialog>
    </Stack>
  );
}
