import { AttachmentCategory } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class CreateAttachmentDto {
  @IsOptional() @IsEnum(AttachmentCategory) category?: AttachmentCategory;
}
