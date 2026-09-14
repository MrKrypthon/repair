// material-ui
import Grid from '@mui/material/Grid';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import useConfig from 'hooks/useConfig';

function valueText(value) {
  return `${value}px`;
}

// ==============================|| CONFIGURACIÓN - RADIO DE BORDES ||============================== //

export default function BorderRadius() {
  const {
    state: { borderRadius },
    setField
  } = useConfig();

  const handleChange = (_event, newValue) => {
    setField('borderRadius', newValue);
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography variant="subtitle1">Radio de bordes</Typography>
      <Grid container spacing={1.25} sx={{ alignItems: 'center', maxWidth: 420 }}>
        <Grid>
          <Typography variant="h6">4px</Typography>
        </Grid>
        <Grid size="grow">
          <Slider
            size="small"
            value={borderRadius}
            onChange={handleChange}
            getAriaValueText={valueText}
            valueLabelDisplay="on"
            aria-labelledby="border-radius-slider"
            min={4}
            max={24}
            color="primary"
          />
        </Grid>
        <Grid>
          <Typography variant="h6">24px</Typography>
        </Grid>
      </Grid>
    </Stack>
  );
}
