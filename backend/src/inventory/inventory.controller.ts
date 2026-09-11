import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, StockChangeDto } from './dto/create-inventory-item.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll() { return this.inventoryService.findAll(); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  create(@Body() body: CreateInventoryItemDto) { return this.inventoryService.create(body); }

  @Patch(':id/stock')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  adjustStock(@Param('id') id: string, @Body() body: StockChangeDto) { return this.inventoryService.adjustStock(id, body); }
}
