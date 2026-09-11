import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AddPartDto, CreateServiceOrderDto, UpdateBudgetDto } from './dto/create-service-order.dto';
import { DeliverOrderDto, UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { CreateTechnicalNoteDto } from './dto/create-technical-note.dto';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { ServiceOrdersService } from './service-orders.service';

const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

@Controller('service-orders')
@UseGuards(JwtAuthGuard)
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Get()
  findAll() {
    return this.serviceOrdersService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  create(@Body() body: CreateServiceOrderDto) {
    return this.serviceOrdersService.create(body);
  }

  @Get(':folio')
  findOne(@Param('folio') folio: string) {
    return this.serviceOrdersService.findOne(folio);
  }

  @Patch(':folio')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST', 'TECHNICIAN')
  update(@Param('folio') folio: string, @Body() body: UpdateServiceOrderDto) {
    return this.serviceOrdersService.update(folio, body);
  }

  @Patch(':folio/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TECHNICIAN', 'RECEPTIONIST')
  updateStatus(@Param('folio') folio: string, @Body() body: Parameters<ServiceOrdersService['updateStatus']>[1]) {
    return this.serviceOrdersService.updateStatus(folio, body);
  }

  @Patch(':folio/budget')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST', 'TECHNICIAN')
  updateBudget(@Param('folio') folio: string, @Body() body: UpdateBudgetDto) {
    return this.serviceOrdersService.updateBudget(folio, body);
  }

  @Post(':folio/parts')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST', 'TECHNICIAN')
  addPart(@Param('folio') folio: string, @Body() body: AddPartDto) {
    return this.serviceOrdersService.addPart(folio, body);
  }

  @Patch(':folio/diagnosis')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TECHNICIAN')
  updateDiagnosis(@Param('folio') folio: string, @Body() body: UpdateDiagnosisDto) {
    return this.serviceOrdersService.updateDiagnosis(folio, body);
  }

  @Patch(':folio/technician')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  assignTechnician(@Param('folio') folio: string, @Body() body: AssignTechnicianDto) {
    return this.serviceOrdersService.assignTechnician(folio, body.technicianId);
  }

  @Post(':folio/deliver')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  deliver(@Param('folio') folio: string, @Body() body: DeliverOrderDto) {
    return this.serviceOrdersService.deliver(folio, body.note);
  }

  @Post(':folio/notes')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TECHNICIAN')
  addTechnicalNote(@Param('folio') folio: string, @Body() body: CreateTechnicalNoteDto) {
    return this.serviceOrdersService.addTechnicalNote(folio, body);
  }

  @Post(':folio/attachments')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST', 'TECHNICIAN')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ATTACHMENT_SIZE } }))
  addAttachment(@Param('folio') folio: string, @UploadedFile() file: Express.Multer.File, @Body() body: CreateAttachmentDto) {
    if (file && !ALLOWED_ATTACHMENT_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF');
    }
    return this.serviceOrdersService.addAttachment(folio, file, body.category);
  }

  @Delete(':folio/attachments/:attachmentId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST', 'TECHNICIAN')
  removeAttachment(@Param('folio') folio: string, @Param('attachmentId') attachmentId: string) {
    return this.serviceOrdersService.removeAttachment(folio, attachmentId);
  }
}
