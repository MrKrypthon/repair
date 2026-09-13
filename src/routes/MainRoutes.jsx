import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import RequireAuth from './RequireAuth';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/Default')));
const Finance = Loadable(lazy(() => import('views/finance')));
const TechnicianProductivity = Loadable(lazy(() => import('views/technician-productivity')));
const Customers = Loadable(lazy(() => import('views/customers')));
const NewCustomer = Loadable(lazy(() => import('views/customers/new')));
const CustomerDetail = Loadable(lazy(() => import('views/customers/detail')));
const ServiceOrders = Loadable(lazy(() => import('views/service-orders')));
const NewServiceOrder = Loadable(lazy(() => import('views/service-orders/new')));
const ServiceOrderDetail = Loadable(lazy(() => import('views/service-orders/detail')));
const Inventory = Loadable(lazy(() => import('views/inventory')));
const Appointments = Loadable(lazy(() => import('views/appointments')));
const TechnicalKnowledge = Loadable(lazy(() => import('views/technical-knowledge')));
const Users = Loadable(lazy(() => import('views/users')));
const Suppliers = Loadable(lazy(() => import('views/suppliers')));
const PurchaseOrders = Loadable(lazy(() => import('views/purchase-orders')));

// utilities routing
const UtilsTypography = Loadable(lazy(() => import('views/utilities/Typography')));
const UtilsColor = Loadable(lazy(() => import('views/utilities/Color')));
const UtilsShadow = Loadable(lazy(() => import('views/utilities/Shadow')));

// sample page routing
const SamplePage = Loadable(lazy(() => import('views/sample-page')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <RequireAuth><MainLayout /></RequireAuth>,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      element: <DashboardDefault />
    },
    {
      path: 'finance',
      element: <Finance />
    },
    {
      path: 'productivity',
      element: <TechnicianProductivity />
    },
    {
      path: 'customers',
      element: <Customers />
    },
    {
      path: 'customers/new',
      element: <NewCustomer />
    },
    {
      path: 'customers/:customerId',
      element: <CustomerDetail />
    },
    {
      path: 'service-orders',
      element: <ServiceOrders />
    },
    {
      path: 'service-orders/new',
      element: <NewServiceOrder />
    },
    {
      path: 'service-orders/:orderId',
      element: <ServiceOrderDetail />
    },
    {
      path: 'inventory',
      element: <Inventory />
    },
    {
      path: 'appointments',
      element: <Appointments />
    },
    {
      path: 'technical-knowledge',
      element: <TechnicalKnowledge />
    },
    {
      path: 'users',
      element: <Users />
    },
    {
      path: 'suppliers',
      element: <Suppliers />
    },
    {
      path: 'purchase-orders',
      element: <PurchaseOrders />
    },
    {
      path: 'typography',
      element: <UtilsTypography />
    },
    {
      path: 'color',
      element: <UtilsColor />
    },
    {
      path: 'shadow',
      element: <UtilsShadow />
    },
    {
      path: '/sample-page',
      element: <SamplePage />
    }
  ]
};

export default MainRoutes;
