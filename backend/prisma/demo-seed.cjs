// Datos demo/dummy cercanos a la realidad, pensados para explorar la app con
// finanzas en positivo. Este script AGREGA datos (no es idempotente): pensado
// para correrse una sola vez sobre una base de datos de desarrollo.
//
// Uso: node prisma/demo-seed.cjs

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const now = Date.now();
let folioCounter = 0;
const nextFolio = (prefix) => `${prefix}-${(now + (folioCounter++) * 37).toString().slice(-6)}`;

async function main() {
  console.log('Creando usuarios...');
  const passwordHash = await bcrypt.hash('Demo123!', 12);
  const [ana, luis, sofia] = await Promise.all([
    prisma.user.upsert({ where: { email: 'ana.garcia@electronicatech.local' }, update: {}, create: { name: 'Ana García', email: 'ana.garcia@electronicatech.local', password: passwordHash, role: 'TECHNICIAN' } }),
    prisma.user.upsert({ where: { email: 'luis.martinez@electronicatech.local' }, update: {}, create: { name: 'Luis Martínez', email: 'luis.martinez@electronicatech.local', password: passwordHash, role: 'TECHNICIAN' } }),
    prisma.user.upsert({ where: { email: 'sofia.hernandez@electronicatech.local' }, update: {}, create: { name: 'Sofía Hernández', email: 'sofia.hernandez@electronicatech.local', password: passwordHash, role: 'RECEPTIONIST' } })
  ]);

  console.log('Creando proveedores...');
  const [movilParts, tecnoCell, importCell] = await Promise.all([
    prisma.supplier.create({ data: { name: 'Refaccionaria MovilParts', phone: '5551000001', email: 'ventas@movilparts.example' } }),
    prisma.supplier.create({ data: { name: 'Distribuidora TecnoCell', phone: '5551000002', email: 'contacto@tecnocell.example' } }),
    prisma.supplier.create({ data: { name: 'ImportCell Repuestos', phone: '5551000003', email: 'pedidos@importcell.example' } })
  ]);

  console.log('Creando inventario...');
  const itemDefs = [
    { name: 'Pantalla iPhone 11 OLED', sku: 'SCR-IP11', category: 'Pantallas', cost: 950, salePrice: 1800, stock: 4, minimumStock: 2, supplierId: movilParts.id },
    { name: 'Pantalla iPhone 12 OLED', sku: 'SCR-IP12', category: 'Pantallas', cost: 1250, salePrice: 2300, stock: 3, minimumStock: 2, supplierId: movilParts.id },
    { name: 'Pantalla iPhone 13 OLED', sku: 'SCR-IP13', category: 'Pantallas', cost: 1600, salePrice: 2900, stock: 3, minimumStock: 2, supplierId: movilParts.id },
    { name: 'Pantalla Samsung A32', sku: 'SCR-SA32', category: 'Pantallas', cost: 780, salePrice: 1500, stock: 4, minimumStock: 2, supplierId: tecnoCell.id },
    { name: 'Pantalla Samsung A54', sku: 'SCR-SA54', category: 'Pantallas', cost: 1100, salePrice: 2100, stock: 3, minimumStock: 2, supplierId: tecnoCell.id },
    { name: 'Cristal trasero Xiaomi Redmi Note 10', sku: 'GLS-XRN10', category: 'Pantallas', cost: 340, salePrice: 700, stock: 4, minimumStock: 2, supplierId: tecnoCell.id },
    { name: 'Batería iPhone 11', sku: 'BAT-IP11', category: 'Baterías', cost: 280, salePrice: 650, stock: 6, minimumStock: 3, supplierId: movilParts.id },
    { name: 'Batería Samsung A32', sku: 'BAT-SA32', category: 'Baterías', cost: 220, salePrice: 550, stock: 6, minimumStock: 3, supplierId: tecnoCell.id },
    { name: 'Centro de carga iPhone', sku: 'CHG-IP', category: 'Componentes', cost: 150, salePrice: 400, stock: 8, minimumStock: 4, supplierId: importCell.id },
    { name: 'Centro de carga Samsung', sku: 'CHG-SA', category: 'Componentes', cost: 130, salePrice: 380, stock: 8, minimumStock: 4, supplierId: importCell.id },
    { name: 'Cámara trasera iPhone 12', sku: 'CAM-IP12', category: 'Componentes', cost: 620, salePrice: 1300, stock: 3, minimumStock: 1, supplierId: movilParts.id },
    { name: 'Flex de volumen universal', sku: 'FLX-VOL', category: 'Componentes', cost: 90, salePrice: 250, stock: 10, minimumStock: 4, supplierId: importCell.id },
    { name: 'Adhesivo B-7000 15ml', sku: 'CON-B7000', category: 'Consumibles', cost: 55, salePrice: 120, stock: 15, minimumStock: 5, supplierId: importCell.id },
    { name: 'Mica templada universal', sku: 'MIC-UNI', category: 'Consumibles', cost: 15, salePrice: 80, stock: 25, minimumStock: 10, supplierId: importCell.id }
  ];
  const items = {};
  for (const def of itemDefs) {
    items[def.sku] = await prisma.inventoryItem.upsert({ where: { sku: def.sku }, update: {}, create: def });
  }

  console.log('Creando órdenes de compra recibidas (gastos reales)...');
  async function receivedPurchaseOrder(supplierId, lines) {
    const order = await prisma.purchaseOrder.create({
      data: { folio: nextFolio('OC'), supplierId, status: 'RECEIVED', lines: { create: lines.map((line) => ({ inventoryItemId: line.itemId, quantity: line.quantity, unitCost: line.unitCost })) } }
    });
    for (const line of lines) {
      await prisma.inventoryMovement.create({ data: { inventoryItemId: line.itemId, type: 'IN', quantity: line.quantity, note: `Recepción de ${order.folio}` } });
    }
    return order;
  }

  await receivedPurchaseOrder(movilParts.id, [
    { itemId: items['SCR-IP11'].id, quantity: 2, unitCost: 950 },
    { itemId: items['SCR-IP13'].id, quantity: 2, unitCost: 1600 },
    { itemId: items['BAT-IP11'].id, quantity: 3, unitCost: 280 },
    { itemId: items['CAM-IP12'].id, quantity: 2, unitCost: 620 }
  ]);
  await receivedPurchaseOrder(tecnoCell.id, [
    { itemId: items['SCR-SA32'].id, quantity: 2, unitCost: 780 },
    { itemId: items['SCR-SA54'].id, quantity: 2, unitCost: 1100 },
    { itemId: items['BAT-SA32'].id, quantity: 3, unitCost: 220 },
    { itemId: items['GLS-XRN10'].id, quantity: 2, unitCost: 340 }
  ]);
  await receivedPurchaseOrder(importCell.id, [
    { itemId: items['CHG-IP'].id, quantity: 4, unitCost: 150 },
    { itemId: items['CHG-SA'].id, quantity: 4, unitCost: 130 },
    { itemId: items['FLX-VOL'].id, quantity: 6, unitCost: 90 },
    { itemId: items['CON-B7000'].id, quantity: 10, unitCost: 55 },
    { itemId: items['MIC-UNI'].id, quantity: 15, unitCost: 15 }
  ]);
  // Una orden todavía en tránsito, no cuenta como gasto hasta que se reciba.
  await prisma.purchaseOrder.create({
    data: { folio: nextFolio('OC'), supplierId: movilParts.id, status: 'ORDERED', lines: { create: [{ inventoryItemId: items['SCR-IP12'].id, quantity: 2, unitCost: 1250 }] } }
  });

  console.log('Creando clientes y equipos...');
  const customerDefs = [
    { name: 'María González', phone: '5512345601', email: 'maria.gonzalez@example.com' },
    { name: 'Carlos Ramírez', phone: '5512345602', email: 'carlos.ramirez@example.com' },
    { name: 'Lucía Torres', phone: '5512345603', email: 'lucia.torres@example.com' },
    { name: 'Diego Herrera', phone: '5512345604', email: 'diego.herrera@example.com' },
    { name: 'Fernanda López', phone: '5512345605', email: 'fernanda.lopez@example.com' },
    { name: 'Roberto Sánchez', phone: '5512345606', email: 'roberto.sanchez@example.com' },
    { name: 'Valentina Cruz', phone: '5512345607', email: 'valentina.cruz@example.com' },
    { name: 'Miguel Ángel Flores', phone: '5512345608', email: 'miguel.flores@example.com' },
    { name: 'Camila Rojas', phone: '5512345609', email: 'camila.rojas@example.com' },
    { name: 'Andrés Morales', phone: '5512345610', email: 'andres.morales@example.com' },
    { name: 'Isabel Vargas', phone: '5512345611', email: 'isabel.vargas@example.com' },
    { name: 'Javier Mendoza', phone: '5512345612', email: 'javier.mendoza@example.com' }
  ];
  const customers = {};
  for (const def of customerDefs) {
    customers[def.name] = await prisma.customer.create({ data: def });
  }

  async function device(customerName, category, brand, model) {
    return prisma.device.create({ data: { customerId: customers[customerName].id, category, brand, model } });
  }

  console.log('Creando órdenes de servicio, presupuestos, pagos y consumo de piezas...');

  async function createOrder({ customerName, deviceDef, reportedIssue, priority, status, diagnosis, probableCause, partsCost, laborCost, otherCharges, finalCost, budgetStatus, technicianId, consumedPart, note, deliveredDaysAgo, receivedDaysAgo }) {
    const dev = await device(customerName, deviceDef.category, deviceDef.brand, deviceDef.model);
    const receivedAt = new Date();
    receivedAt.setDate(receivedAt.getDate() - (receivedDaysAgo ?? 5));
    const folio = nextFolio('OS');
    const order = await prisma.serviceOrder.create({
      data: {
        folio,
        customerId: customers[customerName].id,
        deviceId: dev.id,
        reportedIssue,
        priority: priority || 'NORMAL',
        status,
        diagnosis,
        probableCause,
        partsCost: partsCost || 0,
        laborCost: laborCost || 0,
        otherCharges: otherCharges || 0,
        estimatedCost: partsCost || laborCost ? (partsCost || 0) + (laborCost || 0) + (otherCharges || 0) : undefined,
        finalCost,
        budgetStatus: budgetStatus || 'PENDING',
        assignedTechnicianId: technicianId,
        receivedAt,
        deliveredAt: status === 'ENTREGADO' ? new Date(Date.now() - (deliveredDaysAgo ?? 1) * 86400000) : undefined
      }
    });
    await prisma.statusHistory.create({ data: { serviceOrderId: order.id, previousStatus: null, newStatus: 'RECIBIDO', note: 'Orden creada', createdAt: receivedAt } });
    if (status !== 'RECIBIDO') {
      await prisma.statusHistory.create({ data: { serviceOrderId: order.id, previousStatus: 'RECIBIDO', newStatus: status, note: note || 'Actualización de estado' } });
    }
    if (consumedPart) {
      const item = items[consumedPart.sku];
      await prisma.orderPart.create({ data: { serviceOrderId: order.id, inventoryItemId: item.id, quantity: consumedPart.quantity, unitCost: item.cost, unitPrice: item.salePrice } });
      await prisma.inventoryItem.update({ where: { id: item.id }, data: { stock: { decrement: consumedPart.quantity } } });
      await prisma.inventoryMovement.create({ data: { inventoryItemId: item.id, type: 'OUT', quantity: consumedPart.quantity, note: `Consumo en orden ${folio}` } });
    }
    return order;
  }

  async function pay(order, payments) {
    for (const payment of payments) {
      await prisma.payment.create({ data: { serviceOrderId: order.id, amount: payment.amount, method: payment.method, type: payment.type } });
    }
  }

  const iphone13 = { category: 'CELULAR', brand: 'Apple', model: 'iPhone 13' };
  const samsungA54 = { category: 'CELULAR', brand: 'Samsung', model: 'Galaxy A54' };
  const macbookAir = { category: 'LAPTOP', brand: 'Apple', model: 'MacBook Air' };
  const nintendoSwitch = { category: 'CONSOLA', brand: 'Nintendo', model: 'Switch' };
  const iphone11 = { category: 'CELULAR', brand: 'Apple', model: 'iPhone 11' };
  const samsungA32 = { category: 'CELULAR', brand: 'Samsung', model: 'Galaxy A32' };
  const xiaomiRedmi = { category: 'CELULAR', brand: 'Xiaomi', model: 'Redmi Note 10' };
  const iphone12 = { category: 'CELULAR', brand: 'Apple', model: 'iPhone 12' };
  const ipad = { category: 'TABLET', brand: 'Apple', model: 'iPad 9na gen' };
  const airpods = { category: 'OTRO', brand: 'Apple', model: 'AirPods 2da gen' };

  const o1 = await createOrder({ customerName: 'María González', deviceDef: iphone13, reportedIssue: 'Pantalla estrellada tras caída', priority: 'ALTA', status: 'ENTREGADO', diagnosis: 'Pantalla OLED dañada, táctil funcional', probableCause: 'Golpe directo', partsCost: 2900, laborCost: 400, finalCost: 3300, budgetStatus: 'APPROVED', technicianId: ana.id, consumedPart: { sku: 'SCR-IP13', quantity: 1 }, deliveredDaysAgo: 6, receivedDaysAgo: 10 });
  await pay(o1, [{ amount: 1000, method: 'CASH', type: 'DEPOSIT' }, { amount: 2300, method: 'TRANSFER', type: 'FINAL' }]);

  const o2 = await createOrder({ customerName: 'Carlos Ramírez', deviceDef: samsungA54, reportedIssue: 'No carga el equipo', priority: 'NORMAL', status: 'ENTREGADO', diagnosis: 'Centro de carga oxidado', probableCause: 'Humedad', partsCost: 380, laborCost: 250, finalCost: 630, budgetStatus: 'APPROVED', technicianId: luis.id, consumedPart: { sku: 'CHG-SA', quantity: 1 }, deliveredDaysAgo: 4, receivedDaysAgo: 7 });
  await pay(o2, [{ amount: 630, method: 'CASH', type: 'FINAL' }]);

  await createOrder({ customerName: 'Lucía Torres', deviceDef: macbookAir, reportedIssue: 'No enciende desde ayer', priority: 'ALTA', status: 'EN_DIAGNOSTICO', technicianId: ana.id, receivedDaysAgo: 2 });

  const o4 = await createOrder({ customerName: 'Diego Herrera', deviceDef: nintendoSwitch, reportedIssue: 'Puerto HDMI dañado, no da imagen en TV', priority: 'NORMAL', status: 'LISTO_ENTREGA', diagnosis: 'Puerto HDMI con pines doblados', partsCost: 350, laborCost: 300, finalCost: 650, budgetStatus: 'APPROVED', technicianId: luis.id, receivedDaysAgo: 5 });
  await pay(o4, [{ amount: 300, method: 'CASH', type: 'DEPOSIT' }]);

  const o5 = await createOrder({ customerName: 'Fernanda López', deviceDef: iphone11, reportedIssue: 'Batería dura muy poco', priority: 'NORMAL', status: 'ENTREGADO', diagnosis: 'Batería con 62% de salud', partsCost: 650, laborCost: 200, finalCost: 850, budgetStatus: 'APPROVED', technicianId: ana.id, consumedPart: { sku: 'BAT-IP11', quantity: 1 }, deliveredDaysAgo: 3, receivedDaysAgo: 5 });
  await pay(o5, [{ amount: 850, method: 'CARD', type: 'FINAL' }]);

  const o6 = await createOrder({ customerName: 'Roberto Sánchez', deviceDef: samsungA32, reportedIssue: 'Pantalla no responde al tacto', priority: 'NORMAL', status: 'EN_REPARACION', diagnosis: 'Digitalizador dañado', partsCost: 1500, laborCost: 300, budgetStatus: 'APPROVED', technicianId: luis.id, consumedPart: { sku: 'SCR-SA32', quantity: 1 }, receivedDaysAgo: 2 });
  await pay(o6, [{ amount: 1000, method: 'TRANSFER', type: 'DEPOSIT' }]);

  await createOrder({ customerName: 'Valentina Cruz', deviceDef: xiaomiRedmi, reportedIssue: 'Cristal trasero roto', priority: 'NORMAL', status: 'ESPERA_AUTORIZACION', diagnosis: 'Requiere cristal trasero nuevo', partsCost: 700, laborCost: 250, budgetStatus: 'PENDING', technicianId: luis.id, receivedDaysAgo: 1 });

  const o8 = await createOrder({ customerName: 'Miguel Ángel Flores', deviceDef: iphone12, reportedIssue: 'Cámara trasera borrosa y no enfoca', priority: 'NORMAL', status: 'ENTREGADO', diagnosis: 'Módulo de cámara dañado', partsCost: 1300, laborCost: 350, finalCost: 1650, budgetStatus: 'APPROVED', technicianId: ana.id, consumedPart: { sku: 'CAM-IP12', quantity: 1 }, deliveredDaysAgo: 8, receivedDaysAgo: 11 });
  await pay(o8, [{ amount: 1650, method: 'CASH', type: 'FINAL' }]);

  const o9 = await createOrder({ customerName: 'Camila Rojas', deviceDef: ipad, reportedIssue: 'Pantalla táctil no responde en la mitad inferior', priority: 'ALTA', status: 'EN_PRUEBAS', diagnosis: 'Flex de digitalizador reemplazado', partsCost: 1800, laborCost: 400, budgetStatus: 'APPROVED', technicianId: luis.id, receivedDaysAgo: 4 });
  await pay(o9, [{ amount: 1200, method: 'TRANSFER', type: 'DEPOSIT' }]);

  const o10 = await createOrder({ customerName: 'Andrés Morales', deviceDef: samsungA54, reportedIssue: 'Pantalla con líneas de color', priority: 'NORMAL', status: 'ENTREGADO', diagnosis: 'Panel OLED dañado', partsCost: 2100, laborCost: 350, finalCost: 2450, budgetStatus: 'APPROVED', technicianId: ana.id, consumedPart: { sku: 'SCR-SA54', quantity: 1 }, deliveredDaysAgo: 2, receivedDaysAgo: 4 });
  await pay(o10, [{ amount: 2450, method: 'CARD', type: 'FINAL' }]);

  await createOrder({ customerName: 'María González', deviceDef: iphone13, reportedIssue: 'No enciende después de una caída al agua', priority: 'URGENTE', status: 'RECIBIDO', receivedDaysAgo: 0 });

  const o12 = await createOrder({ customerName: 'Carlos Ramírez', deviceDef: samsungA54, reportedIssue: 'Micrófono no se escucha en llamadas', priority: 'NORMAL', status: 'ESPERA_PIEZA', diagnosis: 'Micrófono dañado, se pidió refacción', partsCost: 300, laborCost: 200, budgetStatus: 'APPROVED', technicianId: luis.id, receivedDaysAgo: 3 });
  await pay(o12, [{ amount: 200, method: 'CASH', type: 'DEPOSIT' }]);

  const o13 = await createOrder({ customerName: 'Fernanda López', deviceDef: iphone11, reportedIssue: 'Cambio de mica protectora', priority: 'NORMAL', status: 'ENTREGADO', partsCost: 80, laborCost: 40, finalCost: 120, budgetStatus: 'APPROVED', technicianId: luis.id, consumedPart: { sku: 'MIC-UNI', quantity: 1 }, deliveredDaysAgo: 1, receivedDaysAgo: 1 });
  await pay(o13, [{ amount: 120, method: 'CASH', type: 'FINAL' }]);

  await createOrder({ customerName: 'Diego Herrera', deviceDef: nintendoSwitch, reportedIssue: 'Joystick izquierdo con drift', priority: 'NORMAL', status: 'CANCELADO', note: 'El cliente decidió comprar un equipo nuevo', receivedDaysAgo: 6 });

  await createOrder({ customerName: 'Valentina Cruz', deviceDef: xiaomiRedmi, reportedIssue: 'Botón de encendido no funciona', priority: 'NORMAL', status: 'SIN_REPARACION', diagnosis: 'Requiere cambio de flex de encendido', partsCost: 400, laborCost: 200, budgetStatus: 'REJECTED', note: 'El cliente rechazó el presupuesto', receivedDaysAgo: 5 });

  const o16 = await createOrder({ customerName: 'Isabel Vargas', deviceDef: iphone13, reportedIssue: 'Pantalla con manchas oscuras', priority: 'NORMAL', status: 'ENTREGADO', diagnosis: 'Panel OLED con burn-in avanzado', partsCost: 2900, laborCost: 400, finalCost: 3300, budgetStatus: 'APPROVED', technicianId: ana.id, consumedPart: { sku: 'SCR-IP13', quantity: 1 }, deliveredDaysAgo: 9, receivedDaysAgo: 12 });
  await pay(o16, [{ amount: 3300, method: 'TRANSFER', type: 'FINAL' }]);

  const o17 = await createOrder({ customerName: 'Javier Mendoza', deviceDef: samsungA54, reportedIssue: 'Pantalla rota y batería inflada', priority: 'ALTA', status: 'ENTREGADO', diagnosis: 'Panel y batería dañados por golpe', partsCost: 2100, laborCost: 500, finalCost: 2800, budgetStatus: 'APPROVED', technicianId: luis.id, consumedPart: { sku: 'SCR-SA54', quantity: 1 }, deliveredDaysAgo: 5, receivedDaysAgo: 8 });
  await pay(o17, [{ amount: 2800, method: 'CASH', type: 'FINAL' }]);

  const o18 = await createOrder({ customerName: 'Isabel Vargas', deviceDef: airpods, reportedIssue: 'Un audífono no carga', priority: 'NORMAL', status: 'ENTREGADO', diagnosis: 'Contacto de carga dañado', partsCost: 300, laborCost: 150, finalCost: 450, budgetStatus: 'APPROVED', technicianId: ana.id, deliveredDaysAgo: 2, receivedDaysAgo: 3 });
  await pay(o18, [{ amount: 450, method: 'CASH', type: 'FINAL' }]);

  console.log('Creando citas de agenda...');
  const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
  await prisma.appointment.createMany({
    data: [
      { title: 'Entrega equipo - Diego Herrera', type: 'DELIVERY', status: 'SCHEDULED', startsAt: inDays(1), endsAt: inDays(1), customerId: customers['Diego Herrera'].id },
      { title: 'Recepción equipo - Cliente nuevo', type: 'RECEIVING', status: 'SCHEDULED', startsAt: inDays(2), endsAt: inDays(2) },
      { title: 'Diagnóstico MacBook Air', type: 'WORK', status: 'SCHEDULED', startsAt: inDays(1), endsAt: inDays(1), customerId: customers['Lucía Torres'].id }
    ]
  });

  console.log('Creando base de conocimiento técnica...');
  await prisma.technicalDocument.createMany({
    data: [
      { title: 'iPhone no enciende tras contacto con agua', category: 'SOLUTION', deviceBrand: 'Apple', deviceModel: 'iPhone', description: 'Protocolo de limpieza con isopropílico y verificación de línea PP5V0_USB antes de energizar.', keywords: 'agua, no enciende, corrosión' },
      { title: 'Samsung A5x líneas de color en pantalla', category: 'KNOWN_ERROR', deviceBrand: 'Samsung', deviceModel: 'Galaxy A5x', description: 'Falla común del panel OLED tras 2-3 años de uso; requiere reemplazo de pantalla completa.', keywords: 'lineas, pantalla, oled' }
    ]
  });

  console.log('Listo.');
  console.log('Usuarios demo (contraseña Demo123!): ana.garcia@electronicatech.local, luis.martinez@electronicatech.local, sofia.hernandez@electronicatech.local');
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
