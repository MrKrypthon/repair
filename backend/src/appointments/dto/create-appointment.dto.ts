import { AppointmentType } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsEnum(AppointmentType) type!: AppointmentType;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() serviceOrderId?: string;
}
