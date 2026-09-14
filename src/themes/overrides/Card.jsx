// ==============================|| OVERRIDES - CARD (interactive/link cards) ||============================== //

export default function CardOverride(theme) {
  return {
    MuiCard: {
      styleOverrides: {
        root: {
          '&[href]': {
            cursor: 'pointer',
            textDecoration: 'none',
            color: 'inherit',
            overflow: 'visible',
            border: '1px solid transparent',
            transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
          },
          '&[href]:hover': {
            transform: 'translateY(-4px)',
            borderColor: theme.vars.palette.divider,
            boxShadow: theme.vars.customShadows.z16
          },
          '&[href]:active': {
            transform: 'translateY(-1px)',
            transition: 'transform 0.08s ease'
          }
        }
      }
    }
  };
}
