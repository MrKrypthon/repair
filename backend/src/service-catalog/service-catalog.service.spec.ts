import { ServiceCatalogService } from './service-catalog.service';

describe('ServiceCatalogService', () => {
  const prisma = { serviceCatalogItem: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() } };
  const service = new ServiceCatalogService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('only returns active items by default', async () => {
    prisma.serviceCatalogItem.findMany.mockResolvedValue([]);

    await service.findAll();

    expect(prisma.serviceCatalogItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } })
    );
  });

  it('includes inactive items only when explicitly requested', async () => {
    prisma.serviceCatalogItem.findMany.mockResolvedValue([]);

    await service.findAll(undefined, true);

    const where = prisma.serviceCatalogItem.findMany.mock.calls[0][0].where;
    expect(where.active).toBeUndefined();
  });

  it('filters by name case-insensitively when a query is given', async () => {
    prisma.serviceCatalogItem.findMany.mockResolvedValue([]);

    await service.findAll('pantalla');

    const where = prisma.serviceCatalogItem.findMany.mock.calls[0][0].where;
    expect(where.name).toEqual({ contains: 'pantalla', mode: 'insensitive' });
    expect(where.active).toBe(true);
  });

  it('defaults cost to 0 when creating a service without an internal cost', async () => {
    prisma.serviceCatalogItem.create.mockResolvedValue({});

    await service.create({ name: 'Diagnóstico', price: 150 });

    expect(prisma.serviceCatalogItem.create).toHaveBeenCalledWith({
      data: { name: 'Diagnóstico', description: undefined, cost: 0, price: 150 }
    });
  });
});
