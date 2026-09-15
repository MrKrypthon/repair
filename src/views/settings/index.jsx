import { useEffect, useRef, useState } from 'react';

import { useColorScheme } from '@mui/material/styles';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'ui-component/cards/MainCard';
import { api } from 'api/client';
import { DEFAULT_THEME_MODE } from 'config';
import useConfig from 'hooks/useConfig';
import FontFamily from './FontFamily';
import BorderRadius from './BorderRadius';

const roleLabels = { ADMIN: 'Administrador', TECHNICIAN: 'Técnico', RECEPTIONIST: 'Recepción' };

function persistUser(user) {
  localStorage.setItem('fixtrack-user', JSON.stringify(user));
}

export default function Settings() {
  const { setMode } = useColorScheme();
  const { resetState } = useConfig();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState({ type: '', text: '' });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState({ type: '', text: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    api
      .me()
      .then((current) => {
        setUser(current);
        setName(current.name);
        persistUser(current);
      })
      .catch(() => {});
  }, []);

  const saveName = (event) => {
    event.preventDefault();
    setSavingName(true);
    setNameMessage({ type: '', text: '' });
    api
      .updateProfile({ name })
      .then((updated) => {
        setUser(updated);
        persistUser(updated);
        setNameMessage({ type: 'success', text: 'Nombre actualizado.' });
        window.setTimeout(() => window.location.reload(), 600);
      })
      .catch(() => setNameMessage({ type: 'error', text: 'No se pudo actualizar el nombre.' }))
      .finally(() => setSavingName(false));
  };

  const selectAvatar = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarMessage({ type: '', text: '' });
    api
      .uploadAvatar(file)
      .then((updated) => {
        persistUser(updated);
        window.location.reload();
      })
      .catch(() => {
        setAvatarMessage({ type: 'error', text: 'No se pudo subir la foto. Usa JPG, PNG o WEBP de máximo 5MB.' });
        setUploadingAvatar(false);
      });
  };

  const removeAvatar = () => {
    setUploadingAvatar(true);
    setAvatarMessage({ type: '', text: '' });
    api
      .removeAvatar()
      .then((updated) => {
        persistUser(updated);
        window.location.reload();
      })
      .catch(() => {
        setAvatarMessage({ type: 'error', text: 'No se pudo quitar la foto.' });
        setUploadingAvatar(false);
      });
  };

  const savePassword = (event) => {
    event.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    setSavingPassword(true);
    api
      .changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      .then(() => {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordMessage({ type: 'success', text: 'Contraseña actualizada.' });
      })
      .catch((error) => setPasswordMessage({ type: 'error', text: error.message || 'No se pudo actualizar la contraseña.' }))
      .finally(() => setSavingPassword(false));
  };

  const resetAppearance = () => {
    setMode(DEFAULT_THEME_MODE);
    resetState();
  };

  if (!user) return null;

  return (
    <Stack spacing={3}>
      <Stack>
        <Typography variant="h2">Configuración</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Administra tu foto, tus datos de acceso y la apariencia de la aplicación.
        </Typography>
      </Stack>

      <MainCard title="Foto de perfil">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'center' }}>
          <Avatar src={user.avatarUrl || undefined} sx={{ width: 88, height: 88, fontSize: 32 }}>
            {!user.avatarUrl && user.name?.[0]}
          </Avatar>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1.5}>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={selectAvatar} />
              <Button
                variant="outlined"
                startIcon={<PhotoCameraRoundedIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                Cambiar foto
              </Button>
              {user.avatarUrl && (
                <Button color="error" startIcon={<DeleteRoundedIcon />} onClick={removeAvatar} disabled={uploadingAvatar}>
                  Quitar foto
                </Button>
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              JPG, PNG o WEBP. Máximo 5MB.
            </Typography>
            {avatarMessage.text && <Alert severity={avatarMessage.type}>{avatarMessage.text}</Alert>}
          </Stack>
        </Stack>
      </MainCard>

      <MainCard title="Datos de la cuenta">
        <Stack component="form" spacing={2.5} onSubmit={saveName}>
          {nameMessage.text && <Alert severity={nameMessage.type}>{nameMessage.text}</Alert>}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField required fullWidth label="Nombre" value={name} onChange={(event) => setName(event.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Correo" value={user.email} disabled helperText="El correo no se puede cambiar desde aquí." />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography color="text.secondary">Rol:</Typography>
            <Chip label={roleLabels[user.role] || user.role} size="small" color="primary" variant="outlined" />
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" startIcon={<SaveRoundedIcon />} disabled={savingName || !name}>
              Guardar nombre
            </Button>
          </Stack>
        </Stack>
      </MainCard>

      <MainCard title="Contraseña">
        <Stack component="form" spacing={2.5} onSubmit={savePassword}>
          {passwordMessage.text && <Alert severity={passwordMessage.type}>{passwordMessage.text}</Alert>}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                required
                fullWidth
                type="password"
                label="Contraseña actual"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                required
                fullWidth
                type="password"
                label="Nueva contraseña"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                required
                fullWidth
                type="password"
                label="Confirmar nueva contraseña"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
              />
            </Grid>
          </Grid>
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" startIcon={<SaveRoundedIcon />} disabled={savingPassword}>
              Actualizar contraseña
            </Button>
          </Stack>
        </Stack>
      </MainCard>

      <MainCard title="Apariencia">
        <Stack spacing={3}>
          <FontFamily />
          <Divider />
          <BorderRadius />
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Button startIcon={<RestartAltRoundedIcon />} onClick={resetAppearance}>
              Restablecer valores predeterminados
            </Button>
          </Stack>
        </Stack>
      </MainCard>
    </Stack>
  );
}
