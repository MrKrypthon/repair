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
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: theme.vars.palette.grey[500],
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
          },
          '&[href]:hover': {
            transform: 'translateY(-4px)',
            borderColor: theme.vars.palette.primary.main,
            boxShadow: '0 16px 32px -4px rgba(0, 0, 0, 0.45)'
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
