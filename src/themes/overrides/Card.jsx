// ==============================|| OVERRIDES - CARD (interactive/link cards) ||============================== //

export default function CardOverride() {
  return {
    MuiCard: {
      styleOverrides: {
        root: {
          '&[href]': {
            cursor: 'pointer',
            textDecoration: 'none',
            color: 'inherit',
            overflow: 'visible',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          },
          '&[href]:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 16px 32px -4px rgba(0, 0, 0, 0.45)'
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
