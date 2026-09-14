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
            transition: 'transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease'
          },
          '&[href]:hover': {
            transform: 'translateY(-4px)',
            backgroundColor: theme.vars.palette.action.hover,
            boxShadow: theme.vars.customShadows.z16
          },
          '&[href]:active': {
            transform: 'translateY(0) scale(0.98)',
            transition: 'transform 0.08s ease'
          }
        }
      }
    }
  };
}
