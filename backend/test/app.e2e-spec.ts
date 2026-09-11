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
});
