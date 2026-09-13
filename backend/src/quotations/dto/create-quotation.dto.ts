import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { DeviceCategory } from '@prisma/client';
import { IsEnum } from 'class-validator';

class QuotationItemDto {
  @IsString() @IsNotEmpty() description!: string;
  @IsInt() @Min(1) quantity!: number;
  @IsNumber() @Min(0) unitPrice!: number;
}

export class CreateQuotationDto {
  @IsString() @IsNotEmpty() customerId!: string;
  @IsOptional() @IsString() deviceId?: string;
  @IsOptional() @IsEnum(DeviceCategory) category?: DeviceCategory;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsString() @IsNotEmpty() issueDescription!: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => QuotationItemDto) items!: QuotationItemDto[];
}

export class UpdateQuotationDto {
  @IsOptional() @IsString() @IsNotEmpty() issueDescription?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => QuotationItemDto) items?: QuotationItemDto[];
}
