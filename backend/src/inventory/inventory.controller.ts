import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, StockChangeDto, UpdateInventoryItemDto } from './dto/create-inventory-item.dto';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(@Query('q') query?: string) { return this.inventoryService.findAll(query); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  create(@Body() body: CreateInventoryItemDto) { return this.inventoryService.create(body); }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  update(@Param('id') id: string, @Body() body: UpdateInventoryItemDto) { return this.inventoryService.update(id, body); }

  @Get(':id/price-history')
  priceHistory(@Param('id') id: string) { return this.inventoryService.priceHistory(id); }

  @Patch(':id/stock')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  adjustStock(@Param('id') id: string, @Body() body: StockChangeDto) { return this.inventoryService.adjustStock(id, body); }

  @Post(':id/image')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_SIZE } }))
  uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (file && !ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes JPG, PNG o WEBP');
    }
    return this.inventoryService.uploadImage(id, file);
  }

  @Delete(':id/image')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  removeImage(@Param('id') id: string) {
    return this.inventoryService.removeImage(id);
  }
}
