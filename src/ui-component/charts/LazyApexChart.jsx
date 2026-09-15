import { Suspense, lazy } from 'react';

import Skeleton from '@mui/material/Skeleton';

const ReactApexChart = lazy(() => import('react-apexcharts'));

export default function LazyApexChart({ height, ...props }) {
  return (
    <Suspense fallback={<Skeleton variant="rounded" height={height} />}>
      <ReactApexChart height={height} {...props} />
    </Suspense>
  );
}
