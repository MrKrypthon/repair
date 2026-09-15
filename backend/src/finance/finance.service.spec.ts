import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  const prisma = {
    payment: { findMany: jest.fn() },
    purchaseOrder: { findMany: jest.fn() }
  };
  const service = new FinanceService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const payment = (amount: number, createdAt: string) => ({
    id: `pay-${amount}-${createdAt}`,
    amount,
    method: 'CASH',
    type: 'DEPOSIT',
    createdAt: new Date(createdAt),
    serviceOrder: { folio: 'OS-1', customer: { name: 'Cliente Uno' } }
  });

  const purchaseOrder = (unitCost: number, quantity: number, updatedAt: string) => ({
    id: `po-${unitCost}-${updatedAt}`,
    folio: 'OC-1',
    updatedAt: new Date(updatedAt),
    supplier: { name: 'Proveedor Uno' },
    lines: [{ unitCost, quantity }]
  });

  it('calculates income, expenses, net profit and margin from real amounts', async () => {
    prisma.payment.findMany.mockResolvedValueOnce([payment(1000, '2026-01-10'), payment(500, '2026-01-15')]).mockResolvedValueOnce([]);
    prisma.purchaseOrder.findMany.mockResolvedValueOnce([purchaseOrder(300, 2, '2026-01-12')]).mockResolvedValueOnce([]);

    const result = await service.summary();

    expect(result.income).toBe(1500);
    expect(result.expenses).toBe(600);
    expect(result.netProfit).toBe(900);
    expect(result.isProfit).toBe(true);
    expect(result.margin).toBeCloseTo(60);
  });

  it('reports a loss (isProfit false) when expenses exceed income', async () => {
    prisma.payment.findMany.mockResolvedValueOnce([payment(100, '2026-01-01')]).mockResolvedValueOnce([]);
    prisma.purchaseOrder.findMany.mockResolvedValueOnce([purchaseOrder(50, 5, '2026-01-01')]).mockResolvedValueOnce([]);

    const result = await service.summary();

    expect(result.income).toBe(100);
    expect(result.expenses).toBe(250);
    expect(result.netProfit).toBe(-150);
    expect(result.isProfit).toBe(false);
  });

  it('returns 0 margin (not NaN or Infinity) when there is no income at all', async () => {
    prisma.payment.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    prisma.purchaseOrder.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await service.summary();

    expect(result.income).toBe(0);
    expect(result.expenses).toBe(0);
    expect(result.margin).toBe(0);
  });

  it('builds movements from both payments and purchase orders, sorted newest first', async () => {
    prisma.payment.findMany.mockResolvedValueOnce([payment(1000, '2026-01-01')]).mockResolvedValueOnce([]);
    prisma.purchaseOrder.findMany.mockResolvedValueOnce([purchaseOrder(200, 1, '2026-01-15')]).mockResolvedValueOnce([]);

    const result = await service.summary();

    expect(result.movements).toHaveLength(2);
    expect(result.movements[0]).toMatchObject({ type: 'EXPENSE', amount: 200, description: 'Compra a Proveedor Uno · OC-1' });
    expect(result.movements[1]).toMatchObject({ type: 'INCOME', amount: 1000, description: 'Pago Anticipo · OS-1 · Cliente Uno' });
  });

  it('passes the requested date range through to both queries', async () => {
    prisma.payment.findMany.mockResolvedValue([]);
    prisma.purchaseOrder.findMany.mockResolvedValue([]);

    await service.summary('2026-01-01', '2026-01-31');

    const paymentsWhere = prisma.payment.findMany.mock.calls[0][0].where;
    expect(paymentsWhere.createdAt.gte).toEqual(new Date('2026-01-01'));
    expect(paymentsWhere.createdAt.lte).toEqual(new Date('2026-01-31'));

    const purchaseOrdersWhere = prisma.purchaseOrder.findMany.mock.calls[0][0].where;
    expect(purchaseOrdersWhere.status).toBe('RECEIVED');
    expect(purchaseOrdersWhere.updatedAt.gte).toEqual(new Date('2026-01-01'));
  });
});
