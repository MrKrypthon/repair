// ==============================|| OVERRIDES - BUTTON ||============================== //

export default function Button(theme) {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          '&:not(.Mui-disabled):hover': {
            transform: 'translateY(-2px)'
          },
          '&:not(.Mui-disabled):active': {
            transform: 'translateY(0) scale(0.97)',
            transition: 'transform 0.08s ease'
          }
        },
        contained: {
          '&:not(.Mui-disabled):hover': {
            boxShadow: theme.vars.customShadows.z8
          }
        },
        outlined: {
          borderWidth: '1.5px',
          '&:not(.Mui-disabled):hover': {
            borderWidth: '1.5px',
            boxShadow: theme.vars.customShadows.z8
          }
        },
        text: {
          '&:not(.Mui-disabled):hover': {
            boxShadow: theme.vars.customShadows.z1
          }
        }
      }
    }
  };
}
