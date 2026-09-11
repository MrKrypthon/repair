import { Injectable } from '@nestjs/common';
import { AppointmentStatus, AppointmentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CreateAppointment = { title: string; type: AppointmentType; startsAt: string; endsAt: string; notes?: string; customerId?: string; serviceOrderId?: string };

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.appointment.findMany({ include: { customer: true, serviceOrder: true }, orderBy: { startsAt: 'asc' } }); }

  create(data: CreateAppointment) {
    return this.prisma.appointment.create({ data: { ...data, startsAt: new Date(data.startsAt), endsAt: new Date(data.endsAt), status: AppointmentStatus.SCHEDULED } });
  }
}
