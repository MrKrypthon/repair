// material-ui
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import useConfig from 'hooks/useConfig';
import MainCard from 'ui-component/cards/MainCard';

// ==============================|| CONFIGURACIÓN - TIPOGRAFÍA ||============================== //

export default function FontFamily() {
  const {
    state: { fontFamily },
    setField
  } = useConfig();

  const handleFontChange = (event) => {
    setField('fontFamily', event.target.value);
  };

  const fonts = [
    { id: 'inter', value: `'Inter', sans-serif`, label: 'Inter' },
    { id: 'poppins', value: `'Poppins', sans-serif`, label: 'Poppins' },
    { id: 'roboto', value: `'Roboto', sans-serif`, label: 'Roboto' }
  ];

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography variant="subtitle1">Tipografía</Typography>
      <RadioGroup aria-label="font-family" name="font-family" value={fontFamily} onChange={handleFontChange}>
        <Grid container spacing={1.25}>
          {fonts.map((item) => (
            <Grid key={item.id} size={{ xs: 12, sm: 4 }}>
              <MainCard content={false} sx={{ p: 0.75, bgcolor: fontFamily === item.value ? 'primary.light' : 'grey.50' }}>
                <MainCard content={false} border sx={{ p: 1.75, borderWidth: 1, ...(fontFamily === item.value && { borderColor: 'primary.main' }) }}>
                  <FormControlLabel
                    sx={{ width: 1 }}
                    control={<Radio value={item.value} sx={{ display: 'none' }} />}
                    label={
                      <Typography variant="h5" sx={{ pl: 2, fontFamily: item.value }}>
                        {item.label}
                      </Typography>
                    }
                  />
                </MainCard>
              </MainCard>
            </Grid>
          ))}
        </Grid>
      </RadioGroup>
    </Stack>
  );
}
