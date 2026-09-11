import { DeviceCategory } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDeviceDto {
  @IsEnum(DeviceCategory) category!: DeviceCategory;
  @IsString() @MinLength(1) brand!: string;
  @IsString() @MinLength(1) model!: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsString() imei?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() notes?: string;
}
