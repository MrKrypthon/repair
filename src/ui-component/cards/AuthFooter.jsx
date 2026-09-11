// material-ui
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// ==============================|| FOOTER - AUTHENTICATION 2 & 3 ||============================== //

export default function AuthFooter() {
  return (
    <Stack direction="row" sx={{ justifyContent: 'center' }}>
      <Typography variant="subtitle2" color="text.secondary">
        &copy; {new Date().getFullYear()} FixTrack
      </Typography>
    </Stack>
  );
}
