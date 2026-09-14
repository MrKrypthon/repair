// ==============================|| OVERRIDES - ICON BUTTON ||============================== //

export default function IconButton() {
  return {
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s ease',
          '&:not(.Mui-disabled):hover': {
            transform: 'translateY(-1px) scale(1.06)'
          }
        }
      }
    }
  };
}
