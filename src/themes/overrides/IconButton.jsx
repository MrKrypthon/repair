// ==============================|| OVERRIDES - ICON BUTTON ||============================== //

export default function IconButton() {
  return {
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s ease, outline-color 0.15s ease',
          outline: '2px solid transparent',
          outlineOffset: '2px',
          '&:not(.Mui-disabled):hover': {
            transform: 'translateY(-1px) scale(1.06)',
            outlineColor: 'currentColor'
          },
          '&:not(.Mui-disabled):active': {
            transform: 'scale(0.92)',
            transition: 'transform 0.08s ease'
          }
        }
      }
    }
  };
}
