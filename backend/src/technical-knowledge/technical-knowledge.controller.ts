import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TechnicalKnowledgeService } from './technical-knowledge.service';
import { CreateTechnicalDocumentDto } from './dto/create-technical-document.dto';

@Controller('technical-knowledge')
@UseGuards(JwtAuthGuard)
export class TechnicalKnowledgeController {
  constructor(private readonly service: TechnicalKnowledgeService) {}

  @Get()
  findAll(@Query('q') query?: string) { return this.service.findAll(query); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TECHNICIAN')
  create(@Body() body: CreateTechnicalDocumentDto) { return this.service.create(body); }
}
