// ==============================|| OVERRIDES - BUTTON ||============================== //

export default function Button(theme) {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          '&:not(.Mui-disabled):hover': {
            transform: 'translateY(-2px)'
          }
        },
        contained: {
          '&:not(.Mui-disabled):hover': {
            boxShadow: theme.vars.customShadows.z8
          }
        },
        outlined: {
          '&:not(.Mui-disabled):hover': {
            boxShadow: theme.vars.customShadows.z1
          }
        }
      }
    }
  };
}
