import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';
import useConfig from 'hooks/useConfig';

// assets
import { IconLogout, IconSettings } from '@tabler/icons-react';

const roleLabels = { ADMIN: 'Administrador', TECHNICIAN: 'Técnico', RECEPTIONIST: 'Recepción' };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ==============================|| PROFILE MENU ||============================== //

export default function ProfileSection() {
  const navigate = useNavigate();
  const theme = useTheme();
  const {
    state: { borderRadius }
  } = useConfig();

  const [open, setOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('fixtrack-user') || '{"name":"Usuario","role":"TECHNICIAN"}');

  const logout = () => {
    localStorage.removeItem('fixtrack-token');
    localStorage.removeItem('fixtrack-user');
    navigate('/pages/login');
  };

  const anchorRef = useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const goToSettings = () => {
    setOpen(false);
    navigate('/settings');
  };

  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  return (
    <>
      <Chip
        slotProps={{ label: { sx: { lineHeight: 0 } } }}
        sx={{ ml: 2, height: '48px', alignItems: 'center', borderRadius: '27px' }}
        icon={
          <Avatar
            src={user.avatarUrl || undefined}
            alt={user.name}
            sx={{ typography: 'mediumAvatar', margin: '8px 0 8px 8px !important', cursor: 'pointer' }}
            ref={anchorRef}
            aria-controls={open ? 'menu-list-grow' : undefined}
            aria-haspopup="true"
            color="inherit"
          >
            {!user.avatarUrl && user.name?.[0]}
          </Avatar>
        }
        label={<IconSettings stroke={1.5} size="24px" />}
        ref={anchorRef}
        aria-controls={open ? 'menu-list-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        color="primary"
        aria-label="user-account"
      />
      <Popper
        placement="bottom"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        modifiers={[{ name: 'offset', options: { offset: [0, 14] } }]}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Transitions in={open} {...TransitionProps}>
              <Paper>
                {open && (
                  <MainCard border={false} elevation={16} content={false} boxShadow shadow={theme.shadows[16]}>
                    <Box sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <Avatar src={user.avatarUrl || undefined} sx={{ width: 40, height: 40 }}>
                          {!user.avatarUrl && user.name?.[0]}
                        </Avatar>
                        <Stack>
                          <Typography variant="h4">
                            {greeting()}, {user.name}
                          </Typography>
                          <Typography variant="subtitle2" color="text.secondary">
                            {roleLabels[user.role] || user.role}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                    <Divider />
                    <Box sx={{ p: 1 }}>
                      <List
                        component="nav"
                        sx={{
                          width: '100%',
                          maxWidth: 300,
                          minWidth: 260,
                          '& .MuiListItemButton-root': { mt: 0.5, borderRadius: `${borderRadius}px` }
                        }}
                      >
                        <ListItemButton onClick={goToSettings}>
                          <ListItemIcon>
                            <IconSettings stroke={1.5} size="20px" />
                          </ListItemIcon>
                          <ListItemText primary={<Typography variant="body2">Configuración</Typography>} />
                        </ListItemButton>
                        <ListItemButton onClick={logout}>
                          <ListItemIcon>
                            <IconLogout stroke={1.5} size="20px" />
                          </ListItemIcon>
                          <ListItemText primary={<Typography variant="body2">Cerrar sesión</Typography>} />
                        </ListItemButton>
                      </List>
                    </Box>
                  </MainCard>
                )}
              </Paper>
            </Transitions>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
}
