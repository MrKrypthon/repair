import { Type } from 'class-transformer';
import { DeviceCategory, Priority } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UpdateOrderDeviceDto {
  @IsOptional() @IsEnum(DeviceCategory) category?: DeviceCategory;
  @IsOptional() @IsString() @IsNotEmpty() brand?: string;
  @IsOptional() @IsString() @IsNotEmpty() model?: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsString() imei?: string;
  @IsOptional() @IsString() color?: string;
}

export class UpdateServiceOrderDto {
  @IsOptional() @IsString() @IsNotEmpty() reportedIssue?: string;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsDateString() estimatedDeliveryAt?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOrderDeviceDto)
  device?: UpdateOrderDeviceDto;
}
