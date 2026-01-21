import { apiClient } from './apiClient';

const createEntityClient = (endpoint) => ({
  list: async (sort) => {
    const res = await apiClient.get(`/${endpoint}`);
    return res.data;
  },
  create: async (data) => {
    const res = await apiClient.post(`/${endpoint}`, data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiClient.put(`/${endpoint}/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await apiClient.delete(`/${endpoint}/${id}`);
    return res.data;
  },
  get: async (id) => {
    const res = await apiClient.get(`/${endpoint}/${id}`);
    return res.data;
  }
});

export const base44 = {
  entities: {
    Booking: createEntityClient('bookings'),
    Employee: createEntityClient('employees'),
    Yacht: createEntityClient('yachts'),
    Package: createEntityClient('packages'),
    Agent: createEntityClient('agents'),
    User: createEntityClient('users'),
    AppSettings: createEntityClient('app-settings'),
    CRMDashboard: createEntityClient('crm-dashboard'),
    PurchaseDashboard: createEntityClient('purchase-dashboard'),
    HRMDashboard: createEntityClient('hrm-dashboard'),
    POSDashboard: createEntityClient('pos-dashboard'),
    AccountsDashboard: createEntityClient('accounts-dashboard'),
    Opportunity: createEntityClient('opportunities'),
    PrivateBooking: createEntityClient('private-bookings'),
    SharedBooking: createEntityClient('shared-bookings'),
    Client: createEntityClient('clients'),
    Catering: createEntityClient('catering'),
    Invoice: createEntityClient('invoices'),
    Vendor: createEntityClient('vendors'),
    PurchaseOrder: createEntityClient('purchase-orders'),
    Inventory: createEntityClient('inventory'),
    Attendance: createEntityClient('attendance'),
    Leave: createEntityClient('leaves'),
    Payroll: createEntityClient('payroll'),
    RestaurantPOS: createEntityClient('restaurant-pos'),
    BarPOS: createEntityClient('bar-pos'),
    POSOrder: createEntityClient('pos-orders'),
    Ledger: createEntityClient('ledger'),
    FinancialReport: createEntityClient('financial-reports'),
    // Add other entities as generic fallbacks if needed, or map them explicitly
    // For now, we map the ones we know are used.
    // If the app crashes on a missing entity, we add it here.
  },
  auth: {
    me: async () => {
      // Call /api/auth/me if implemented, or just return stored user if using client-side state for MVP
      // For now, we'll try to fetch from backend, if fails, return null
      try {
        const res = await apiClient.get('/auth/me');
        return res.data;
      } catch (e) {
        return null;
      }
    },
    login: async (email, password) => {
      const res = await apiClient.post('/auth/login', { email, password });
      return res.data;
    },
    logout: async (redirectUrl) => {
      try {
        await apiClient.post('/auth/logout');
      } catch (e) {
        console.error('Logout failed', e);
      }
      if (redirectUrl) window.location.href = redirectUrl;
    },
    redirectToLogin: (redirectUrl) => {
      window.location.href = '/login';
    }
  },
  appLogs: {
    logUserInApp: async (pageName) => {
      console.log(`User navigated to ${pageName}`);
      return Promise.resolve();
    }
  }
};
