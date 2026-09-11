import dashboard from './dashboard';
import finance from './finance';
import operations from './operations';
import inventory from './inventory';
import appointments from './appointments';
import technicalKnowledge from './technical-knowledge';
import users from './users';
import suppliers from './suppliers';
import purchaseOrders from './purchase-orders';
import pages from './pages';
import utilities from './utilities';
import other from './other';

// ==============================|| MENU ITEMS ||============================== //

const menuItems = {
  items: [dashboard, finance, operations, inventory, suppliers, purchaseOrders, appointments, technicalKnowledge, users, pages, utilities, other]
};

export default menuItems;
