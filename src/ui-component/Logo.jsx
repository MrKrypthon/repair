// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ==============================|| LOGO ||============================== //

export default function Logo() {
  const theme = useTheme();

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box component="svg" width={32} height={32} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" sx={{ flexShrink: 0 }}>
        <rect width="32" height="32" rx="9" fill={theme.vars.palette.primary.main} />
        <path d="M8 17 L13.5 22.5 L24 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="26" cy="6" r="6" fill={theme.vars.palette.background.paper} />
        <circle cx="26" cy="6" r="4.2" fill={theme.vars.palette.secondary.main} />
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1, whiteSpace: 'nowrap' }}>
        <Box component="span" sx={{ color: 'text.primary' }}>Fix</Box>
        <Box component="span" sx={{ color: 'primary.main' }}>Track</Box>
      </Typography>
    </Stack>
  );
}
