const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(localStorage.getItem('electronica-tech-token') ? { Authorization: `Bearer ${localStorage.getItem('electronica-tech-token')}` } : {}),
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Error ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export const api = {
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  listTechnicians: () => request('/auth/technicians'),
  listCustomers: () => request('/customers'),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  archiveCustomer: (id, active) => request(`/customers/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  getCustomer: (id) => request(`/customers/${id}`),
  createDevice: (customerId, data) => request(`/customers/${customerId}/devices`, { method: 'POST', body: JSON.stringify(data) }),
  listServiceOrders: () => request('/service-orders'),
  createServiceOrder: (data) => request('/service-orders', { method: 'POST', body: JSON.stringify(data) }),
  getServiceOrder: (folio) => request(`/service-orders/${folio}`),
  updateServiceOrderStatus: (folio, data) => request(`/service-orders/${folio}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  createPayment: (folio, data) => request(`/service-orders/${folio}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  updateServiceOrderBudget: (folio, data) => request(`/service-orders/${folio}/budget`, { method: 'PATCH', body: JSON.stringify(data) }),
  listInventory: () => request('/inventory'),
  createInventoryItem: (data) => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  adjustInventory: (id, data) => request(`/inventory/${id}/stock`, { method: 'PATCH', body: JSON.stringify(data) }),
  addOrderPart: (folio, data) => request(`/service-orders/${folio}/parts`, { method: 'POST', body: JSON.stringify(data) }),
  updateDiagnosis: (folio, data) => request(`/service-orders/${folio}/diagnosis`, { method: 'PATCH', body: JSON.stringify(data) }),
  assignTechnician: (folio, technicianId) => request(`/service-orders/${folio}/technician`, { method: 'PATCH', body: JSON.stringify({ technicianId: technicianId || undefined }) }),
  deliverServiceOrder: (folio, note) => request(`/service-orders/${folio}/deliver`, { method: 'POST', body: JSON.stringify({ note }) }),
  addTechnicalNote: (folio, data) => request(`/service-orders/${folio}/notes`, { method: 'POST', body: JSON.stringify(data) }),
  addOrderAttachment: (folio, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/service-orders/${folio}/attachments`, { method: 'POST', body: formData });
  },
  deleteOrderAttachment: (folio, attachmentId) => request(`/service-orders/${folio}/attachments/${attachmentId}`, { method: 'DELETE' }),
  publicTracking: (token) => request(`/public/tracking/${token}`),
  publicBudget: (token, budgetStatus) => request(`/public/tracking/${token}/budget`, { method: 'PATCH', body: JSON.stringify({ budgetStatus }) }),
  listNotifications: () => request('/notifications'),
  listUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  listSuppliers: () => request('/suppliers'),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  listPurchaseOrders: () => request('/purchase-orders'),
  createPurchaseOrder: (data) => request('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  receivePurchaseOrder: (id) => request(`/purchase-orders/${id}/receive`, { method: 'PATCH' }),
  orderPurchaseOrder: (id) => request(`/purchase-orders/${id}/order`, { method: 'PATCH' }),
  cancelPurchaseOrder: (id) => request(`/purchase-orders/${id}/cancel`, { method: 'PATCH' }),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  listAppointments: () => request('/appointments'),
  createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  listTechnicalKnowledge: (query = '') => request(`/technical-knowledge${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  createTechnicalDocument: (data) => request('/technical-knowledge', { method: 'POST', body: JSON.stringify(data) }),
  getDashboardMetrics: () => request('/analytics/dashboard')
};
