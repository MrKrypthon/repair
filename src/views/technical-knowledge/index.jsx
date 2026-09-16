import { useEffect, useMemo, useState } from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';

const demoDocuments = [
  {
    id: 'd1',
    title: 'iPhone 12 no enciende: línea VDD_MAIN',
    category: 'SOLUTION',
    deviceBrand: 'Apple',
    deviceModel: 'iPhone 12',
    description: 'Medición y solución para corto en línea principal.',
    keywords: 'VDD_MAIN corto no enciende'
  },
  {
    id: 'd2',
    title: 'Mediciones placa Samsung A52',
    category: 'MEASUREMENT',
    deviceBrand: 'Samsung',
    deviceModel: 'A52',
    description: 'Valores de referencia en líneas de carga.',
    keywords: 'carga USB VPH_PWR'
  },
  {
    id: 'd3',
    title: 'Procedimiento de diagnóstico de carga',
    category: 'PROCEDURE',
    deviceBrand: '',
    deviceModel: '',
    description: 'Secuencia general para diagnosticar equipos que no cargan.',
    keywords: 'carga diagnóstico'
  }
];

const categoryLabel = {
  SOLUTION: 'Solución',
  MEASUREMENT: 'Medición',
  DIAGRAM: 'Diagrama',
  DATASHEET: 'Datasheet',
  PROCEDURE: 'Procedimiento',
  KNOWN_ERROR: 'Falla conocida'
};

export default function TechnicalKnowledge() {
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', category: 'SOLUTION', deviceBrand: '', deviceModel: '', description: '', keywords: '' });
  const [customers, setCustomers] = useState([]);
  const [savingDocument, setSavingDocument] = useState(false);

  const loadDocuments = () =>
    api
      .listTechnicalKnowledge(query)
      .then(setDocuments)
      .catch(() => setError('No se pudo conectar con la API. Mostrando documentación de ejemplo.'))
      .finally(() => setLoading(false));
  useEffect(() => {
    loadDocuments();
  }, []);
  useEffect(() => {
    api
      .listCustomers()
      .then(setCustomers)
      .catch(() => {});
  }, []);
  const source = error ? demoDocuments : documents;

  const knownDevices = useMemo(() => customers.flatMap((customer) => customer.devices || []), [customers]);
  const brandOptions = useMemo(
    () => [...new Set(knownDevices.map((device) => device.brand))].sort((a, b) => a.localeCompare(b)),
    [knownDevices]
  );
  const modelOptions = useMemo(() => {
    const matches = form.deviceBrand
      ? knownDevices.filter((device) => device.brand.toLowerCase() === form.deviceBrand.toLowerCase())
      : knownDevices;
    return [...new Set(matches.map((device) => device.model))].sort((a, b) => a.localeCompare(b));
  }, [knownDevices, form.deviceBrand]);
  const createDocument = (event) => {
    event.preventDefault();
    setSavingDocument(true);
    api
      .createTechnicalDocument(form)
      .then(() => {
        setForm({ title: '', category: 'SOLUTION', deviceBrand: '', deviceModel: '', description: '', keywords: '' });
        return loadDocuments();
      })
      .catch(() => setError('No se pudo guardar el documento.'))
      .finally(() => setSavingDocument(false));
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h2">Base técnica</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Convierte la experiencia del taller en conocimiento reutilizable.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} href="#new-document">
          Nueva solución
        </Button>
      </Stack>
      {error && <Alert severity="warning">{error}</Alert>}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <MainCard content={false} sx={{ flex: 1 }}>
          <Box sx={{ p: 2.5 }}>
            <TextField
              fullWidth
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && loadDocuments()}
              placeholder="Buscar por modelo, síntoma o componente"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Box>
          <Stack spacing={1.5} sx={{ p: 2.5, pt: 0 }}>
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : source.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                {query ? 'Nada coincide con la búsqueda.' : 'Todavía no hay documentos técnicos registrados.'}
              </Typography>
            ) : (
              source.map((document) => (
                <Box key={document.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <ArticleRoundedIcon color="primary" fontSize="small" />
                    <Typography fontWeight={600}>{document.title}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={categoryLabel[document.category] || document.category} size="small" color="primary" variant="outlined" />
                    {document.deviceModel && <Chip label={`${document.deviceBrand} ${document.deviceModel}`} size="small" />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {document.description}
                  </Typography>
                </Box>
              ))
            )}
          </Stack>
        </MainCard>
        <MainCard title="Nueva solución" id="new-document" sx={{ width: { md: 380 } }}>
          <Stack component="form" spacing={2} onSubmit={createDocument}>
            <TextField
              required
              fullWidth
              label="Título"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
            <TextField
              select
              fullWidth
              label="Tipo"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {Object.entries(categoryLabel).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={1}>
              <Autocomplete
                freeSolo
                fullWidth
                options={brandOptions}
                inputValue={form.deviceBrand}
                onInputChange={(event, value) => setForm({ ...form, deviceBrand: value })}
                renderInput={(params) => <TextField {...params} label="Marca" />}
              />
              <Autocomplete
                freeSolo
                fullWidth
                options={modelOptions}
                inputValue={form.deviceModel}
                onInputChange={(event, value) => setForm({ ...form, deviceModel: value })}
                renderInput={(params) => <TextField {...params} label="Modelo" />}
              />
            </Stack>
            <TextField
              required
              fullWidth
              multiline
              minRows={4}
              label="Descripción / solución"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
            <TextField
              fullWidth
              label="Palabras clave"
              value={form.keywords}
              onChange={(event) => setForm({ ...form, keywords: event.target.value })}
            />
            <Button type="submit" variant="contained" disabled={savingDocument}>
              {savingDocument ? 'Guardando...' : 'Guardar documento'}
            </Button>
          </Stack>
        </MainCard>
      </Stack>
    </Stack>
  );
}
