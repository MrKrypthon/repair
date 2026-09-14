// material-ui
import { useColorScheme, useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

// assets
import { IconMoon, IconSun } from '@tabler/icons-react';

// ==============================|| THEME MODE TOGGLE ||============================== //

export default function ThemeModeSection() {
  const theme = useTheme();
  const { mode, systemMode, setMode } = useColorScheme();
  const resolvedMode = mode === 'system' ? systemMode : mode;
  const isDark = resolvedMode === 'dark';

  const toggleMode = () => setMode(isDark ? 'light' : 'dark');

  return (
    <Box sx={{ ml: 2 }}>
      <Tooltip title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
        <Avatar
          variant="rounded"
          sx={{
            ...theme.typography.commonAvatar,
            ...theme.typography.mediumAvatar,
            transition: 'all .2s ease-in-out',
            color: theme.vars.palette.secondary.dark,
            background: theme.vars.palette.secondary.light,
            '&:hover': {
              color: theme.vars.palette.secondary.light,
              background: theme.vars.palette.secondary.dark
            }
          }}
          onClick={toggleMode}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <IconSun stroke={1.5} size="20px" /> : <IconMoon stroke={1.5} size="20px" />}
        </Avatar>
      </Tooltip>
    </Box>
  );
}
