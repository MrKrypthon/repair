import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ArchiveCustomerDto } from './dto/archive-customer.dto';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  update(@Param('id') id: string, @Body() body: UpdateCustomerDto) {
    return this.customersService.update(id, body);
  }

  @Patch(':id/archive')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  archive(@Param('id') id: string, @Body() body: ArchiveCustomerDto) {
    return this.customersService.update(id, { active: body.active });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  create(@Body() body: CreateCustomerDto) {
    return this.customersService.create(body);
  }

  @Post(':id/devices')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  createDevice(@Param('id') customerId: string, @Body() body: CreateDeviceDto) {
    return this.customersService.createDevice(customerId, body);
  }
}
