import Dashboard from './pages/Dashboard';
import Yachts from './pages/Yachts';
import Packages from './pages/Packages';
import Agents from './pages/Agents';
import Bookings from './pages/Bookings';
import BarCounter from './pages/BarCounter';
import Invoices from './pages/Invoices';
import Vendors from './pages/Vendors';
import PurchaseOrders from './pages/PurchaseOrders';
import Inventory from './pages/Inventory';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import RestaurantPOS from './pages/RestaurantPOS';
import BarPOS from './pages/BarPOS';
import POSOrders from './pages/POSOrders';
import Ledger from './pages/Ledger';
import FinancialReports from './pages/FinancialReports';
import CRMDashboard from './pages/CRMDashboard';
import HRMDashboard from './pages/HRMDashboard';
import PurchaseDashboard from './pages/PurchaseDashboard';
import AccountsDashboard from './pages/AccountsDashboard';
import POSDashboard from './pages/POSDashboard';
import Opportunity from './pages/Opportunity';
import PrivateBookings from './pages/PrivateBookings';
import SharedBookings from './pages/SharedBookings';
import Catering from './pages/Catering';
import Clients from './pages/Clients';
import Users from './pages/Users';
import AppSettings from './pages/AppSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Yachts": Yachts,
    "Packages": Packages,
    "Agents": Agents,
    "Bookings": Bookings,
    "BarCounter": BarCounter,
    "Invoices": Invoices,
    "Vendors": Vendors,
    "PurchaseOrders": PurchaseOrders,
    "Inventory": Inventory,
    "Employees": Employees,
    "Attendance": Attendance,
    "Leaves": Leaves,
    "Payroll": Payroll,
    "RestaurantPOS": RestaurantPOS,
    "BarPOS": BarPOS,
    "POSOrders": POSOrders,
    "Ledger": Ledger,
    "FinancialReports": FinancialReports,
    "CRMDashboard": CRMDashboard,
    "HRMDashboard": HRMDashboard,
    "PurchaseDashboard": PurchaseDashboard,
    "AccountsDashboard": AccountsDashboard,
    "POSDashboard": POSDashboard,
    "Opportunity": Opportunity,
    "PrivateBookings": PrivateBookings,
    "SharedBookings": SharedBookings,
    "Catering": Catering,
    "Clients": Clients,
    "Users": Users,
    "AppSettings": AppSettings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};