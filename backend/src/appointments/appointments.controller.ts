import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/create-appointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll() { return this.appointmentsService.findAll(); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  create(@Body() body: CreateAppointmentDto) { return this.appointmentsService.create(body); }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  updateStatus(@Param('id') id: string, @Body() body: UpdateAppointmentStatusDto) {
    return this.appointmentsService.updateStatus(id, body.status);
  }
}
