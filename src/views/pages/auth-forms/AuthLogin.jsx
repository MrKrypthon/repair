import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import AnimateButton from 'ui-component/extended/AnimateButton';
import CustomFormControl from 'ui-component/extended/Form/CustomFormControl';
import { api } from 'api/client';

export default function AuthLogin() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(true);
  const [email, setEmail] = useState('admin@electronicatech.local');
  const [password, setPassword] = useState('Admin123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    api.login({ email, password }).then((result) => {
      localStorage.setItem('electronica-tech-token', result.accessToken);
      localStorage.setItem('electronica-tech-user', JSON.stringify(result.user));
      navigate(result.user.role === 'TECHNICIAN' ? '/service-orders' : '/dashboard');
    }).catch(() => setError('Correo o contraseña incorrectos.')).finally(() => setLoading(false));
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <CustomFormControl fullWidth>
        <InputLabel htmlFor="outlined-adornment-email-login">Correo electrónico</InputLabel>
        <OutlinedInput id="outlined-adornment-email-login" type="email" value={email} onChange={(event) => setEmail(event.target.value)} name="email" required label="Correo electrónico" />
      </CustomFormControl>
      <CustomFormControl fullWidth>
        <InputLabel htmlFor="outlined-adornment-password-login">Contraseña</InputLabel>
        <OutlinedInput
          id="outlined-adornment-password-login"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          name="password"
          required
          endAdornment={<InputAdornment position="end"><IconButton aria-label="mostrar contraseña" onClick={() => setShowPassword((value) => !value)} edge="end" size="large">{showPassword ? <Visibility /> : <VisibilityOff />}</IconButton></InputAdornment>}
          label="Contraseña"
        />
      </CustomFormControl>
      <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Grid><FormControlLabel control={<Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} name="checked" color="primary" />} label="Mantener sesión" /></Grid>
        <Grid><Typography variant="subtitle1" component={Link} to="#!" sx={{ textDecoration: 'none', color: 'secondary.main' }}>¿Olvidaste tu contraseña?</Typography></Grid>
      </Grid>
      <Box sx={{ mt: 2 }}><AnimateButton><Button color="secondary" fullWidth size="large" type="submit" variant="contained" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</Button></AnimateButton></Box>
    </Box>
  );
}
