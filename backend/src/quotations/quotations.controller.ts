import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { QuotationStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateQuotationDto, UpdateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';
import { QuotationsService } from './quotations.service';

@Controller('quotations')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(private readonly service: QuotationsService) {}

  @Get()
  findAll(@Query('status') status?: QuotationStatus) {
    return this.service.findAll(status);
  }

  @Get(':folio')
  findOne(@Param('folio') folio: string) {
    return this.service.findOne(folio);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  create(@Body() body: CreateQuotationDto, @Req() request: { user: { sub: string } }) {
    return this.service.create(body, request.user.sub);
  }

  @Patch(':folio')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  update(@Param('folio') folio: string, @Body() body: UpdateQuotationDto) {
    return this.service.update(folio, body);
  }

  @Patch(':folio/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  updateStatus(@Param('folio') folio: string, @Body() body: UpdateQuotationStatusDto) {
    return this.service.updateStatus(folio, body.status);
  }

  @Post(':folio/convert')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  convert(@Param('folio') folio: string) {
    return this.service.convert(folio);
  }
}
