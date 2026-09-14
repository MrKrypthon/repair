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
            border: '3px solid transparent',
            transition: 'transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease'
          },
          '&[href]:hover': {
            transform: 'translateY(-6px)',
            borderColor: theme.vars.palette.primary.main,
            backgroundColor: theme.vars.palette.action.hover
          },
          '&[href]:active': {
            transform: 'translateY(-2px)',
            transition: 'transform 0.08s ease'
          }
        }
      }
    }
  };
}
