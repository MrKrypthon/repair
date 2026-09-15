import { AppointmentsService } from './appointments.service';

describe('AppointmentsService', () => {
  const prisma = { appointment: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() } };
  const service = new AppointmentsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates new appointments as SCHEDULED and converts date strings to Date objects', async () => {
    prisma.appointment.create.mockResolvedValue({});

    await service.create({ title: 'Entrega', type: 'DELIVERY' as never, startsAt: '2026-01-10T10:00:00.000Z', endsAt: '2026-01-10T10:30:00.000Z' });

    const data = prisma.appointment.create.mock.calls[0][0].data;
    expect(data.status).toBe('SCHEDULED');
    expect(data.startsAt).toBeInstanceOf(Date);
    expect(data.endsAt).toBeInstanceOf(Date);
    expect(data.startsAt.toISOString()).toBe('2026-01-10T10:00:00.000Z');
  });

  it('updates only the status field, leaving everything else untouched', async () => {
    prisma.appointment.update.mockResolvedValue({});

    await service.updateStatus('appt-1', 'CANCELLED' as never);

    expect(prisma.appointment.update).toHaveBeenCalledWith({ where: { id: 'appt-1' }, data: { status: 'CANCELLED' } });
  });
});
