import { Priority } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWarrantyClaimDto {
  @IsString() @IsNotEmpty() reportedIssue!: string;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
}
