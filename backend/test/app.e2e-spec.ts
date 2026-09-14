import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Electrónica Tech API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => app.close());

  it('authenticates the development admin over HTTP', async () => {
    const response = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.role).toBe('ADMIN');
  });

  it('rejects protected resources without a token', async () => {
    await request(app.getHttpServer()).get('/api/customers').expect(401);
  });

  it('persists the main repair flow across modules', async () => {
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const token = login.body.accessToken;
    const suffix = Date.now();

    const customer = await request(app.getHttpServer()).post('/api/customers').set('Authorization', `Bearer ${token}`).send({ name: 'E2E Cliente', phone: `555${suffix}`, email: `e2e-${suffix}@test.local` }).expect(201);
    const order = await request(app.getHttpServer()).post('/api/service-orders').set('Authorization', `Bearer ${token}`).send({ customerId: customer.body.id, category: 'CELULAR', brand: 'Test', model: 'E2E One', reportedIssue: 'No enciende', priority: 'NORMAL' }).expect(201);
    const item = await request(app.getHttpServer()).post('/api/inventory').set('Authorization', `Bearer ${token}`).send({ name: `Pieza E2E ${suffix}`, sku: `E2E-${suffix}`, category: 'Test', cost: 10, salePrice: 25, stock: 2, minimumStock: 1 }).expect(201);

    await request(app.getHttpServer()).post(`/api/service-orders/${order.body.folio}/parts`).set('Authorization', `Bearer ${token}`).send({ inventoryItemId: item.body.id, quantity: 1 }).expect(201);
    await request(app.getHttpServer()).post(`/api/service-orders/${order.body.folio}/payments`).set('Authorization', `Bearer ${token}`).send({ amount: 25, method: 'CASH', type: 'DEPOSIT' }).expect(201);

    const detail = await request(app.getHttpServer()).get(`/api/service-orders/${order.body.folio}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(detail.body.customer.id).toBe(customer.body.id);
    expect(detail.body.parts).toHaveLength(1);
    expect(detail.body.payments).toHaveLength(1);

    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    const attachment = await request(app.getHttpServer())
      .post(`/api/service-orders/${order.body.folio}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', png, { filename: 'e2e.png', contentType: 'image/png' })
      .expect(201);
    expect(attachment.body.url).toEqual(expect.any(String));

    const detailWithAttachment = await request(app.getHttpServer()).get(`/api/service-orders/${order.body.folio}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(detailWithAttachment.body.attachments).toHaveLength(1);

    await request(app.getHttpServer()).delete(`/api/service-orders/${order.body.folio}/attachments/${attachment.body.id}`).set('Authorization', `Bearer ${token}`).expect(200);

    const detailWithoutAttachment = await request(app.getHttpServer()).get(`/api/service-orders/${order.body.folio}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(detailWithoutAttachment.body.attachments).toHaveLength(0);

    const updated = await request(app.getHttpServer())
      .patch(`/api/service-orders/${order.body.folio}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reportedIssue: 'No enciende, pantalla en negro', priority: 'ALTA', device: { brand: 'Test Actualizado', model: 'E2E One Pro' } })
      .expect(200);
    expect(updated.body.reportedIssue).toBe('No enciende, pantalla en negro');
    expect(updated.body.priority).toBe('ALTA');
    expect(updated.body.device.brand).toBe('Test Actualizado');
    expect(updated.body.device.model).toBe('E2E One Pro');

    await request(app.getHttpServer()).patch(`/api/service-orders/${order.body.folio}`).set('Authorization', `Bearer ${token}`).send({ reportedIssue: '' }).expect(400);
  });

  it('rejects attachments outside the allowed types', async () => {
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const token = login.body.accessToken;
    const suffix = Date.now();

    const customer = await request(app.getHttpServer()).post('/api/customers').set('Authorization', `Bearer ${token}`).send({ name: 'E2E Cliente Adjuntos', phone: `556${suffix}`, email: `e2e-att-${suffix}@test.local` }).expect(201);
    const order = await request(app.getHttpServer()).post('/api/service-orders').set('Authorization', `Bearer ${token}`).send({ customerId: customer.body.id, category: 'CELULAR', brand: 'Test', model: 'E2E Two', reportedIssue: 'No carga', priority: 'NORMAL' }).expect(201);

    await request(app.getHttpServer())
      .post(`/api/service-orders/${order.body.folio}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('no es una imagen'), { filename: 'nota.txt', contentType: 'text/plain' })
      .expect(400);
  });

  it('enforces role limits: only admin/recepción authorize budgets, view the dashboard, or adjust stock manually', async () => {
    const adminLogin = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const adminToken = adminLogin.body.accessToken;
    const suffix = Date.now();

    await request(app.getHttpServer()).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({ name: 'E2E Técnico', email: `e2e-tech-${suffix}@test.local`, password: 'Tecnico123!', role: 'TECHNICIAN' }).expect(201);
    const techLogin = await request(app.getHttpServer()).post('/api/auth/login').send({ email: `e2e-tech-${suffix}@test.local`, password: 'Tecnico123!' }).expect(201);
    const techToken = techLogin.body.accessToken;

    const customer = await request(app.getHttpServer()).post('/api/customers').set('Authorization', `Bearer ${adminToken}`).send({ name: 'E2E Cliente Roles', phone: `557${suffix}`, email: `e2e-roles-${suffix}@test.local` }).expect(201);
    const order = await request(app.getHttpServer()).post('/api/service-orders').set('Authorization', `Bearer ${adminToken}`).send({ customerId: customer.body.id, category: 'CELULAR', brand: 'Test', model: 'E2E Roles', reportedIssue: 'No carga', priority: 'NORMAL' }).expect(201);
    const item = await request(app.getHttpServer()).post('/api/inventory').set('Authorization', `Bearer ${adminToken}`).send({ name: `Pieza Roles ${suffix}`, sku: `ROLES-${suffix}`, category: 'Test', cost: 10, salePrice: 25, stock: 5, minimumStock: 1 }).expect(201);

    // el técnico puede cargar el desglose de costos sin cambiar la autorización
    await request(app.getHttpServer()).patch(`/api/service-orders/${order.body.folio}/budget`).set('Authorization', `Bearer ${techToken}`).send({ partsCost: 100, laborCost: 50, otherCharges: 0 }).expect(200);
    // pero no puede autorizar ni rechazar el presupuesto
    await request(app.getHttpServer()).patch(`/api/service-orders/${order.body.folio}/budget`).set('Authorization', `Bearer ${techToken}`).send({ partsCost: 100, laborCost: 50, otherCharges: 0, budgetStatus: 'APPROVED' }).expect(403);
    // administración sí puede
    await request(app.getHttpServer()).patch(`/api/service-orders/${order.body.folio}/budget`).set('Authorization', `Bearer ${adminToken}`).send({ partsCost: 100, laborCost: 50, otherCharges: 0, budgetStatus: 'APPROVED' }).expect(200);

    // el técnico sigue pudiendo consumir piezas dentro de una orden
    await request(app.getHttpServer()).post(`/api/service-orders/${order.body.folio}/parts`).set('Authorization', `Bearer ${techToken}`).send({ inventoryItemId: item.body.id, quantity: 1 }).expect(201);
    // pero no puede hacer ajustes manuales de stock
    await request(app.getHttpServer()).patch(`/api/inventory/${item.body.id}/stock`).set('Authorization', `Bearer ${techToken}`).send({ type: 'IN', quantity: 1 }).expect(403);
    await request(app.getHttpServer()).patch(`/api/inventory/${item.body.id}/stock`).set('Authorization', `Bearer ${adminToken}`).send({ type: 'IN', quantity: 1 }).expect(200);

    // el técnico no puede ver el dashboard financiero
    await request(app.getHttpServer()).get('/api/analytics/dashboard').set('Authorization', `Bearer ${techToken}`).expect(403);
    await request(app.getHttpServer()).get('/api/analytics/dashboard').set('Authorization', `Bearer ${adminToken}`).expect(200);
  });

  it('supports product images and search in inventory', async () => {
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const token = login.body.accessToken;
    const suffix = Date.now();

    const item = await request(app.getHttpServer()).post('/api/inventory').set('Authorization', `Bearer ${token}`).send({ name: `Pantalla Buscable ${suffix}`, sku: `IMG-${suffix}`, category: 'Pantallas', cost: 100, salePrice: 200, stock: 5, minimumStock: 1 }).expect(201);
    expect(item.body.imageUrl).toBeNull();

    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    const withImage = await request(app.getHttpServer())
      .post(`/api/inventory/${item.body.id}/image`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', png, { filename: 'producto.png', contentType: 'image/png' })
      .expect(201);
    expect(withImage.body.imageUrl).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post(`/api/inventory/${item.body.id}/image`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('no es una imagen'), { filename: 'nota.txt', contentType: 'text/plain' })
      .expect(400);

    const found = await request(app.getHttpServer()).get(`/api/inventory?q=${encodeURIComponent(`Buscable ${suffix}`)}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(found.body.map((record: { id: string }) => record.id)).toContain(item.body.id);

    const notFound = await request(app.getHttpServer()).get('/api/inventory?q=zzz-no-existe-en-ningun-lado').set('Authorization', `Bearer ${token}`).expect(200);
    expect(notFound.body).toHaveLength(0);

    const withoutImage = await request(app.getHttpServer()).delete(`/api/inventory/${item.body.id}/image`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(withoutImage.body.imageUrl).toBeNull();
  });

  it('exposes photos (but not documents) on the public tracking page', async () => {
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const token = login.body.accessToken;
    const suffix = Date.now();

    const customer = await request(app.getHttpServer()).post('/api/customers').set('Authorization', `Bearer ${token}`).send({ name: 'E2E Cliente Tracking', phone: `558${suffix}`, email: `e2e-track-${suffix}@test.local` }).expect(201);
    const order = await request(app.getHttpServer()).post('/api/service-orders').set('Authorization', `Bearer ${token}`).send({ customerId: customer.body.id, category: 'CELULAR', brand: 'Test', model: 'E2E Tracking', reportedIssue: 'No enciende', priority: 'NORMAL' }).expect(201);

    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    await request(app.getHttpServer())
      .post(`/api/service-orders/${order.body.folio}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', png, { filename: 'foto.png', contentType: 'image/png' })
      .expect(201);

    const publicView = await request(app.getHttpServer()).get(`/api/public/tracking/${order.body.publicTrackingToken}`).expect(200);
    expect(publicView.body.attachments).toHaveLength(1);
    expect(publicView.body.attachments[0].url).toEqual(expect.any(String));
    expect(publicView.body.statusHistory).toHaveLength(1);
  });

  it('computes finance summary from payments and received purchase orders, and restricts it to admin', async () => {
    const adminLogin = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const adminToken = adminLogin.body.accessToken;
    const suffix = Date.now();

    await request(app.getHttpServer()).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({ name: 'E2E Recepción', email: `e2e-recep-${suffix}@test.local`, password: 'Recepcion123!', role: 'RECEPTIONIST' }).expect(201);
    const recepLogin = await request(app.getHttpServer()).post('/api/auth/login').send({ email: `e2e-recep-${suffix}@test.local`, password: 'Recepcion123!' }).expect(201);
    const recepToken = recepLogin.body.accessToken;

    await request(app.getHttpServer()).get('/api/finance/summary').set('Authorization', `Bearer ${recepToken}`).expect(403);

    const before = await request(app.getHttpServer()).get('/api/finance/summary').set('Authorization', `Bearer ${adminToken}`).expect(200);
    const baseIncome = before.body.income;
    const baseExpenses = before.body.expenses;

    const customer = await request(app.getHttpServer()).post('/api/customers').set('Authorization', `Bearer ${adminToken}`).send({ name: 'E2E Cliente Finanzas', phone: `559${suffix}`, email: `e2e-fin-${suffix}@test.local` }).expect(201);
    const order = await request(app.getHttpServer()).post('/api/service-orders').set('Authorization', `Bearer ${adminToken}`).send({ customerId: customer.body.id, category: 'CELULAR', brand: 'Test', model: 'E2E Finanzas', reportedIssue: 'No enciende', priority: 'NORMAL' }).expect(201);
    await request(app.getHttpServer()).post(`/api/service-orders/${order.body.folio}/payments`).set('Authorization', `Bearer ${adminToken}`).send({ amount: 150, method: 'CASH', type: 'DEPOSIT' }).expect(201);

    const supplier = await request(app.getHttpServer()).post('/api/suppliers').set('Authorization', `Bearer ${adminToken}`).send({ name: `Proveedor E2E ${suffix}` }).expect(201);
    const item = await request(app.getHttpServer()).post('/api/inventory').set('Authorization', `Bearer ${adminToken}`).send({ name: `Pieza Finanzas ${suffix}`, sku: `FIN-${suffix}`, category: 'Test', cost: 10, salePrice: 25, stock: 0, minimumStock: 0 }).expect(201);
    const purchaseOrder = await request(app.getHttpServer()).post('/api/purchase-orders').set('Authorization', `Bearer ${adminToken}`).send({ supplierId: supplier.body.id, lines: [{ inventoryItemId: item.body.id, quantity: 3, unitCost: 20 }] }).expect(201);
    await request(app.getHttpServer()).patch(`/api/purchase-orders/${purchaseOrder.body.id}/order`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    await request(app.getHttpServer()).patch(`/api/purchase-orders/${purchaseOrder.body.id}/receive`).set('Authorization', `Bearer ${adminToken}`).expect(200);

    const after = await request(app.getHttpServer()).get('/api/finance/summary').set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(after.body.income).toBeCloseTo(baseIncome + 150);
    expect(after.body.expenses).toBeCloseTo(baseExpenses + 60);
    expect(after.body.netProfit).toBeCloseTo(after.body.income - after.body.expenses);
    expect(after.body.isProfit).toBe(after.body.netProfit >= 0);
    expect(after.body.monthly).toHaveLength(12);
    expect(after.body.movements.some((movement: { type: string; description: string }) => movement.type === 'INCOME' && movement.description.includes(order.body.folio))).toBe(true);
    expect(after.body.movements.some((movement: { type: string; description: string }) => movement.type === 'EXPENSE' && movement.description.includes(purchaseOrder.body.folio))).toBe(true);
  });

  it('creates appointments and updates their status', async () => {
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const token = login.body.accessToken;
    const suffix = Date.now();

    const customer = await request(app.getHttpServer()).post('/api/customers').set('Authorization', `Bearer ${token}`).send({ name: 'E2E Cliente Agenda', phone: `560${suffix}`, email: `e2e-agenda-${suffix}@test.local` }).expect(201);
    const appointment = await request(app.getHttpServer())
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Entrega equipo E2E', type: 'DELIVERY', startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 30 * 60000).toISOString(), customerId: customer.body.id })
      .expect(201);
    expect(appointment.body.status).toBe('SCHEDULED');

    const list = await request(app.getHttpServer()).get('/api/appointments').set('Authorization', `Bearer ${token}`).expect(200);
    const found = list.body.find((item: { id: string }) => item.id === appointment.body.id);
    expect(found.customer.name).toBe('E2E Cliente Agenda');

    const completed = await request(app.getHttpServer()).patch(`/api/appointments/${appointment.body.id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'COMPLETED' }).expect(200);
    expect(completed.body.status).toBe('COMPLETED');
  });

  it('alerts once when stock crosses the minimum threshold, via manual adjustment or order consumption', async () => {
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const token = login.body.accessToken;
    const suffix = Date.now();

    const item = await request(app.getHttpServer()).post('/api/inventory').set('Authorization', `Bearer ${token}`).send({ name: `Pieza Stock Bajo ${suffix}`, sku: `LOW-${suffix}`, category: 'Test', cost: 10, salePrice: 25, stock: 5, minimumStock: 3 }).expect(201);

    await request(app.getHttpServer()).patch(`/api/inventory/${item.body.id}/stock`).set('Authorization', `Bearer ${token}`).send({ type: 'OUT', quantity: 1 }).expect(200);
    let notifications = await request(app.getHttpServer()).get('/api/notifications').set('Authorization', `Bearer ${token}`).expect(200);
    expect(notifications.body.some((n: { message: string }) => n.message.includes(`LOW-${suffix}`))).toBe(false);

    await request(app.getHttpServer()).patch(`/api/inventory/${item.body.id}/stock`).set('Authorization', `Bearer ${token}`).send({ type: 'OUT', quantity: 1 }).expect(200);
    notifications = await request(app.getHttpServer()).get('/api/notifications').set('Authorization', `Bearer ${token}`).expect(200);
    const lowStockAlerts = notifications.body.filter((n: { message: string; type: string }) => n.message.includes(`LOW-${suffix}`));
    expect(lowStockAlerts).toHaveLength(1);
    expect(lowStockAlerts[0].type).toBe('WARNING');

    await request(app.getHttpServer()).patch(`/api/inventory/${item.body.id}/stock`).set('Authorization', `Bearer ${token}`).send({ type: 'OUT', quantity: 1 }).expect(200);
    notifications = await request(app.getHttpServer()).get('/api/notifications').set('Authorization', `Bearer ${token}`).expect(200);
    expect(notifications.body.filter((n: { message: string }) => n.message.includes(`LOW-${suffix}`))).toHaveLength(1);

    const customer = await request(app.getHttpServer()).post('/api/customers').set('Authorization', `Bearer ${token}`).send({ name: 'E2E Cliente Stock', phone: `561${suffix}`, email: `e2e-stock-${suffix}@test.local` }).expect(201);
    const order = await request(app.getHttpServer()).post('/api/service-orders').set('Authorization', `Bearer ${token}`).send({ customerId: customer.body.id, category: 'CELULAR', brand: 'Test', model: 'E2E Stock', reportedIssue: 'No enciende', priority: 'NORMAL' }).expect(201);

    const item2 = await request(app.getHttpServer()).post('/api/inventory').set('Authorization', `Bearer ${token}`).send({ name: `Pieza Stock Bajo Orden ${suffix}`, sku: `LOW2-${suffix}`, category: 'Test', cost: 10, salePrice: 25, stock: 3, minimumStock: 2 }).expect(201);
    await request(app.getHttpServer()).post(`/api/service-orders/${order.body.folio}/parts`).set('Authorization', `Bearer ${token}`).send({ inventoryItemId: item2.body.id, quantity: 1 }).expect(201);
    notifications = await request(app.getHttpServer()).get('/api/notifications').set('Authorization', `Bearer ${token}`).expect(200);
    expect(notifications.body.some((n: { message: string }) => n.message.includes(`LOW2-${suffix}`))).toBe(true);
  });

  it('tracks warranty on delivery and links a warranty claim to the original order', async () => {
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const token = login.body.accessToken;
    const suffix = Date.now();

    const customer = await request(app.getHttpServer()).post('/api/customers').set('Authorization', `Bearer ${token}`).send({ name: 'E2E Cliente Garantía', phone: `562${suffix}`, email: `e2e-warranty-${suffix}@test.local` }).expect(201);
    const order = await request(app.getHttpServer()).post('/api/service-orders').set('Authorization', `Bearer ${token}`).send({ customerId: customer.body.id, category: 'CELULAR', brand: 'Test', model: 'E2E Garantía', reportedIssue: 'Pantalla rota', priority: 'NORMAL' }).expect(201);

    // sin garantía vigente: entregar sin marcar LISTO_ENTREGA primero debe fallar
    await request(app.getHttpServer()).post(`/api/service-orders/${order.body.folio}/warranty-claim`).set('Authorization', `Bearer ${token}`).send({ reportedIssue: 'x' }).expect(400);

    await request(app.getHttpServer()).patch(`/api/service-orders/${order.body.folio}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'LISTO_ENTREGA' }).expect(200);
    const delivered = await request(app.getHttpServer()).post(`/api/service-orders/${order.body.folio}/deliver`).set('Authorization', `Bearer ${token}`).send({ warrantyDays: 30 }).expect(201);
    expect(delivered.body.warrantyDays).toBe(30);
    expect(new Date(delivered.body.warrantyExpiresAt).getTime()).toBeGreaterThan(Date.now());

    const claim = await request(app.getHttpServer())
      .post(`/api/service-orders/${order.body.folio}/warranty-claim`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reportedIssue: 'Volvió a fallar la pantalla' })
      .expect(201);
    expect(claim.body.folio).toMatch(/^GA-/);
    expect(claim.body.status).toBe('RECIBIDO');
    expect(claim.body.customerId).toBe(customer.body.id);
    expect(claim.body.deviceId).toBe(delivered.body.deviceId);

    const originalDetail = await request(app.getHttpServer()).get(`/api/service-orders/${order.body.folio}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(originalDetail.body.warrantyClaims).toHaveLength(1);
    expect(originalDetail.body.warrantyClaims[0].folio).toBe(claim.body.folio);

    const claimDetail = await request(app.getHttpServer()).get(`/api/service-orders/${claim.body.folio}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(claimDetail.body.warrantyForOrder.folio).toBe(order.body.folio);

    // segunda orden entregada sin garantía: el reclamo debe rechazarse
    const order2 = await request(app.getHttpServer()).post('/api/service-orders').set('Authorization', `Bearer ${token}`).send({ customerId: customer.body.id, category: 'CELULAR', brand: 'Test', model: 'E2E Sin Garantía', reportedIssue: 'x', priority: 'NORMAL' }).expect(201);
    await request(app.getHttpServer()).patch(`/api/service-orders/${order2.body.folio}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'LISTO_ENTREGA' }).expect(200);
    await request(app.getHttpServer()).post(`/api/service-orders/${order2.body.folio}/deliver`).set('Authorization', `Bearer ${token}`).send({}).expect(201);
    await request(app.getHttpServer()).post(`/api/service-orders/${order2.body.folio}/warranty-claim`).set('Authorization', `Bearer ${token}`).send({ reportedIssue: 'x' }).expect(400);

    const publicView = await request(app.getHttpServer()).get(`/api/public/tracking/${delivered.body.publicTrackingToken}`).expect(200);
    expect(publicView.body.warrantyDays).toBe(30);
  });

  it('searches across customers, service orders and inventory', async () => {
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const token = login.body.accessToken;
    const suffix = Date.now();
    const name = `Zzz Buscable ${suffix}`;

    const customer = await request(app.getHttpServer()).post('/api/customers').set('Authorization', `Bearer ${token}`).send({ name, phone: `563${suffix}`, email: `e2e-search-${suffix}@test.local` }).expect(201);
    const order = await request(app.getHttpServer()).post('/api/service-orders').set('Authorization', `Bearer ${token}`).send({ customerId: customer.body.id, category: 'CELULAR', brand: 'Test', model: 'E2E Search', reportedIssue: 'No enciende', priority: 'NORMAL' }).expect(201);
    const item = await request(app.getHttpServer()).post('/api/inventory').set('Authorization', `Bearer ${token}`).send({ name: `Pieza ${name}`, sku: `SRCH-${suffix}`, category: 'Test', cost: 10, salePrice: 25, stock: 1, minimumStock: 0 }).expect(201);

    const empty = await request(app.getHttpServer()).get('/api/search?q=z').set('Authorization', `Bearer ${token}`).expect(200);
    expect(empty.body).toEqual({ customers: [], serviceOrders: [], inventory: [] });

    const byCustomerName = await request(app.getHttpServer()).get(`/api/search?q=${encodeURIComponent(name)}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(byCustomerName.body.customers.some((c: { id: string }) => c.id === customer.body.id)).toBe(true);
    expect(byCustomerName.body.serviceOrders.some((o: { folio: string }) => o.folio === order.body.folio)).toBe(true);
    expect(byCustomerName.body.inventory.some((i: { id: string }) => i.id === item.body.id)).toBe(true);

    const byFolio = await request(app.getHttpServer()).get(`/api/search?q=${order.body.folio}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(byFolio.body.serviceOrders.some((o: { folio: string }) => o.folio === order.body.folio)).toBe(true);

    await request(app.getHttpServer()).get('/api/search').expect(401);
  });

  it('reports technician productivity restricted to admin', async () => {
    const adminLogin = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const adminToken = adminLogin.body.accessToken;
    const suffix = Date.now();

    const tech = await request(app.getHttpServer()).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({ name: `E2E Técnico Productividad ${suffix}`, email: `e2e-prod-${suffix}@test.local`, password: 'Tecnico123!', role: 'TECHNICIAN' }).expect(201);
    const techLogin = await request(app.getHttpServer()).post('/api/auth/login').send({ email: `e2e-prod-${suffix}@test.local`, password: 'Tecnico123!' }).expect(201);

    const customer = await request(app.getHttpServer()).post('/api/customers').set('Authorization', `Bearer ${adminToken}`).send({ name: 'E2E Cliente Productividad', phone: `564${suffix}`, email: `e2e-prodc-${suffix}@test.local` }).expect(201);
    const order = await request(app.getHttpServer()).post('/api/service-orders').set('Authorization', `Bearer ${adminToken}`).send({ customerId: customer.body.id, category: 'CELULAR', brand: 'Test', model: 'E2E Productividad', reportedIssue: 'No enciende', priority: 'NORMAL' }).expect(201);
    await request(app.getHttpServer()).patch(`/api/service-orders/${order.body.folio}/technician`).set('Authorization', `Bearer ${adminToken}`).send({ technicianId: tech.body.id }).expect(200);
    await request(app.getHttpServer()).patch(`/api/service-orders/${order.body.folio}/budget`).set('Authorization', `Bearer ${adminToken}`).send({ partsCost: 0, laborCost: 500, otherCharges: 0, finalCost: 500, budgetStatus: 'APPROVED' }).expect(200);
    await request(app.getHttpServer()).patch(`/api/service-orders/${order.body.folio}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'LISTO_ENTREGA' }).expect(200);
    await request(app.getHttpServer()).post(`/api/service-orders/${order.body.folio}/deliver`).set('Authorization', `Bearer ${adminToken}`).send({}).expect(201);

    const report = await request(app.getHttpServer()).get('/api/analytics/technicians').set('Authorization', `Bearer ${adminToken}`).expect(200);
    const row = report.body.find((r: { id: string }) => r.id === tech.body.id);
    expect(row).toBeDefined();
    expect(row.closedOrders).toBeGreaterThanOrEqual(1);
    expect(row.revenue).toBeGreaterThanOrEqual(500);
    expect(row.profit).toBeGreaterThanOrEqual(500);

    const futureReport = await request(app.getHttpServer()).get('/api/analytics/technicians?from=2099-01-01').set('Authorization', `Bearer ${adminToken}`).expect(200);
    const futureRow = futureReport.body.find((r: { id: string }) => r.id === tech.body.id);
    expect(futureRow.closedOrders).toBe(0);

    await request(app.getHttpServer()).get('/api/analytics/technicians').set('Authorization', `Bearer ${techLogin.body.accessToken}`).expect(403);
  });

  it('tracks price history from manual edits and purchase order receipts', async () => {
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const token = login.body.accessToken;
    const suffix = Date.now();

    const item = await request(app.getHttpServer()).post('/api/inventory').set('Authorization', `Bearer ${token}`).send({ name: `Pieza Historial ${suffix}`, sku: `HIST-${suffix}`, category: 'Test', cost: 10, salePrice: 25, stock: 5, minimumStock: 1 }).expect(201);

    const emptyHistory = await request(app.getHttpServer()).get(`/api/inventory/${item.body.id}/price-history`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(emptyHistory.body).toHaveLength(0);

    // editar sin tocar costo/precio no debe generar historial
    await request(app.getHttpServer()).patch(`/api/inventory/${item.body.id}`).set('Authorization', `Bearer ${token}`).send({ minimumStock: 2 }).expect(200);
    const stillEmpty = await request(app.getHttpServer()).get(`/api/inventory/${item.body.id}/price-history`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(stillEmpty.body).toHaveLength(0);

    // edición manual de costo/precio sí genera historial
    const edited = await request(app.getHttpServer()).patch(`/api/inventory/${item.body.id}`).set('Authorization', `Bearer ${token}`).send({ cost: 15, salePrice: 30 }).expect(200);
    expect(edited.body.cost).toBe('15');
    const afterManual = await request(app.getHttpServer()).get(`/api/inventory/${item.body.id}/price-history`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(afterManual.body).toHaveLength(1);
    expect(afterManual.body[0].source).toBe('MANUAL');
    expect(afterManual.body[0].previousCost).toBe('10');
    expect(afterManual.body[0].newCost).toBe('15');

    // recibir una orden de compra con costo distinto también genera historial
    const supplier = await request(app.getHttpServer()).post('/api/suppliers').set('Authorization', `Bearer ${token}`).send({ name: `Proveedor Historial ${suffix}` }).expect(201);
    const purchaseOrder = await request(app.getHttpServer()).post('/api/purchase-orders').set('Authorization', `Bearer ${token}`).send({ supplierId: supplier.body.id, lines: [{ inventoryItemId: item.body.id, quantity: 2, unitCost: 22 }] }).expect(201);
    await request(app.getHttpServer()).patch(`/api/purchase-orders/${purchaseOrder.body.id}/order`).set('Authorization', `Bearer ${token}`).expect(200);
    await request(app.getHttpServer()).patch(`/api/purchase-orders/${purchaseOrder.body.id}/receive`).set('Authorization', `Bearer ${token}`).expect(200);

    const afterReceive = await request(app.getHttpServer()).get(`/api/inventory/${item.body.id}/price-history`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(afterReceive.body).toHaveLength(2);
    const fromPurchaseOrder = afterReceive.body.find((entry: { source: string }) => entry.source === 'PURCHASE_ORDER');
    expect(fromPurchaseOrder.previousCost).toBe('15');
    expect(fromPurchaseOrder.newCost).toBe('22');
    expect(fromPurchaseOrder.reference).toBe(purchaseOrder.body.folio);
  });

  it('creates quotations and converts approved ones into service orders', async () => {
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const token = login.body.accessToken;
    const suffix = Date.now();

    const customer = await request(app.getHttpServer()).post('/api/customers').set('Authorization', `Bearer ${token}`).send({ name: 'E2E Cliente Cotización', phone: `566${suffix}`, email: `e2e-cot-${suffix}@test.local` }).expect(201);

    const quotation = await request(app.getHttpServer())
      .post('/api/quotations')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: customer.body.id, category: 'CELULAR', brand: 'E2E', model: 'Modelo Cotización', issueDescription: 'No enciende', items: [{ description: 'Pantalla', quantity: 1, unitPrice: 500 }, { description: 'Mano de obra', quantity: 1, unitPrice: 150 }] })
      .expect(201);
    expect(quotation.body.status).toBe('DRAFT');
    expect(quotation.body.folio).toMatch(/^COT-/);

    // editar mientras está en borrador sí se permite
    const edited = await request(app.getHttpServer()).patch(`/api/quotations/${quotation.body.folio}`).set('Authorization', `Bearer ${token}`).send({ notes: 'Precio sujeto a disponibilidad' }).expect(200);
    expect(edited.body.notes).toBe('Precio sujeto a disponibilidad');

    await request(app.getHttpServer()).patch(`/api/quotations/${quotation.body.folio}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'SENT' }).expect(200);

    // ya no se puede editar una vez enviada
    await request(app.getHttpServer()).patch(`/api/quotations/${quotation.body.folio}`).set('Authorization', `Bearer ${token}`).send({ notes: 'no debería aplicar' }).expect(400);

    // convertir antes de aprobar debe fallar
    await request(app.getHttpServer()).post(`/api/quotations/${quotation.body.folio}/convert`).set('Authorization', `Bearer ${token}`).expect(400);

    await request(app.getHttpServer()).patch(`/api/quotations/${quotation.body.folio}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'APPROVED' }).expect(200);

    const converted = await request(app.getHttpServer()).post(`/api/quotations/${quotation.body.folio}/convert`).set('Authorization', `Bearer ${token}`).expect(201);
    expect(converted.body.folio).toMatch(/^OS-/);
    expect(converted.body.reportedIssue).toBe('No enciende');
    expect(converted.body.estimatedCost).toBe('650');

    const afterConvert = await request(app.getHttpServer()).get(`/api/quotations/${quotation.body.folio}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(afterConvert.body.status).toBe('CONVERTED');
    expect(afterConvert.body.serviceOrder.folio).toBe(converted.body.folio);

    // no se puede convertir dos veces
    await request(app.getHttpServer()).post(`/api/quotations/${quotation.body.folio}/convert`).set('Authorization', `Bearer ${token}`).expect(400);

    await request(app.getHttpServer()).post('/api/users').set('Authorization', `Bearer ${token}`).send({ name: `E2E Técnico Cotización ${suffix}`, email: `e2e-cot-tech-${suffix}@test.local`, password: 'Tecnico123!', role: 'TECHNICIAN' }).expect(201);
    const techLogin = await request(app.getHttpServer()).post('/api/auth/login').send({ email: `e2e-cot-tech-${suffix}@test.local`, password: 'Tecnico123!' }).expect(201);
    await request(app.getHttpServer()).post('/api/quotations').set('Authorization', `Bearer ${techLogin.body.accessToken}`).send({ customerId: customer.body.id, category: 'CELULAR', brand: 'E2E', model: 'X', issueDescription: 'x', items: [{ description: 'x', quantity: 1, unitPrice: 1 }] }).expect(403);

    await request(app.getHttpServer()).get('/api/quotations').expect(401);
  });

  it('lets a user manage their own profile: name, password and avatar', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    const adminLogin = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin@electronicatech.local', password: 'Admin123!' }).expect(201);
    const adminToken = adminLogin.body.accessToken;
    const suffix = Date.now();

    await request(app.getHttpServer()).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({ name: `E2E Técnico Perfil ${suffix}`, email: `e2e-profile-${suffix}@test.local`, password: 'Tecnico123!', role: 'TECHNICIAN' }).expect(201);
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email: `e2e-profile-${suffix}@test.local`, password: 'Tecnico123!' }).expect(201);
    const token = login.body.accessToken;

    const me = await request(app.getHttpServer()).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(me.body.avatarUrl).toBeNull();

    const renamed = await request(app.getHttpServer()).patch('/api/auth/me').set('Authorization', `Bearer ${token}`).send({ name: 'Nombre Actualizado E2E' }).expect(200);
    expect(renamed.body.name).toBe('Nombre Actualizado E2E');

    // contraseña actual incorrecta se rechaza
    await request(app.getHttpServer()).patch('/api/auth/me/password').set('Authorization', `Bearer ${token}`).send({ currentPassword: 'incorrecta', newPassword: 'NuevaClave123!' }).expect(400);

    await request(app.getHttpServer()).patch('/api/auth/me/password').set('Authorization', `Bearer ${token}`).send({ currentPassword: 'Tecnico123!', newPassword: 'NuevaClave123!' }).expect(200);

    // la contraseña anterior ya no funciona; la nueva sí
    await request(app.getHttpServer()).post('/api/auth/login').send({ email: `e2e-profile-${suffix}@test.local`, password: 'Tecnico123!' }).expect(401);
    await request(app.getHttpServer()).post('/api/auth/login').send({ email: `e2e-profile-${suffix}@test.local`, password: 'NuevaClave123!' }).expect(201);

    const avatar = await request(app.getHttpServer())
      .post('/api/auth/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', png, { filename: 'avatar.png', contentType: 'image/png' })
      .expect(201);
    expect(avatar.body.avatarUrl).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post('/api/auth/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('no es una imagen'), { filename: 'nota.txt', contentType: 'text/plain' })
      .expect(400);

    const withoutAvatar = await request(app.getHttpServer()).delete('/api/auth/me/avatar').set('Authorization', `Bearer ${token}`).expect(200);
    expect(withoutAvatar.body.avatarUrl).toBeNull();
  });
});
