import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

export const journeySteps = [
  { label: 'Recibido', icon: SearchRoundedIcon, statuses: ['RECIBIDO'] },
  { label: 'Diagnóstico', icon: FactCheckRoundedIcon, statuses: ['ESPERA_DIAGNOSTICO', 'EN_DIAGNOSTICO'] },
  { label: 'Autorización', icon: AssignmentTurnedInRoundedIcon, statuses: ['ESPERA_AUTORIZACION'] },
  { label: 'Reparación', icon: BuildRoundedIcon, statuses: ['ESPERA_PIEZA', 'EN_REPARACION', 'EN_PRUEBAS'] },
  { label: 'Listo para entrega', icon: Inventory2RoundedIcon, statuses: ['LISTO_ENTREGA'] },
  { label: 'Entregado', icon: LocalShippingRoundedIcon, statuses: ['ENTREGADO'] }
];

export const activeStepIndex = (status) => {
  const index = journeySteps.findIndex((step) => step.statuses.includes(status));
  return index === -1 ? 0 : index;
};
