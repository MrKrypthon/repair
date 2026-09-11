import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrdersService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  create(@Body() body: CreatePurchaseOrderDto) { return this.service.create(body); }

  @Patch(':id/receive')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  receive(@Param('id') id: string) { return this.service.receive(id); }

  @Patch(':id/order')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  order(@Param('id') id: string) { return this.service.order(id); }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  cancel(@Param('id') id: string) { return this.service.cancel(id); }
}
