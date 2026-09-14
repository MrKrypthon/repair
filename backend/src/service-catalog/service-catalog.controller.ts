import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ArchiveServiceCatalogItemDto, CreateServiceCatalogItemDto, UpdateServiceCatalogItemDto } from './dto/create-service-catalog-item.dto';
import { ServiceCatalogService } from './service-catalog.service';

@Controller('service-catalog')
@UseGuards(JwtAuthGuard)
export class ServiceCatalogController {
  constructor(private readonly service: ServiceCatalogService) {}

  @Get()
  findAll(@Query('q') query?: string, @Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(query, includeInactive === 'true');
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  create(@Body() body: CreateServiceCatalogItemDto) {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  update(@Param('id') id: string, @Body() body: UpdateServiceCatalogItemDto) {
    return this.service.update(id, body);
  }

  @Patch(':id/archive')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  archive(@Param('id') id: string, @Body() body: ArchiveServiceCatalogItemDto) {
    return this.service.archive(id, body.active);
  }
}
