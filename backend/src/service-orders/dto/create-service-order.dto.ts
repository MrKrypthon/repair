import { BudgetStatus, DeviceCategory, Priority } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceOrderDto {
  @IsString() @IsNotEmpty() customerId!: string;
  @IsOptional() @IsString() deviceId?: string;
  @IsEnum(DeviceCategory) category!: DeviceCategory;
  @IsString() @IsNotEmpty() brand!: string;
  @IsString() @IsNotEmpty() model!: string;
  @IsString() @IsNotEmpty() reportedIssue!: string;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsString() imei?: string;
  @IsOptional() @IsDateString() estimatedDeliveryAt?: string;
}

export class UpdateBudgetDto {
  @IsNumber() @Min(0) partsCost!: number;
  @IsNumber() @Min(0) laborCost!: number;
  @IsNumber() @Min(0) otherCharges!: number;
  @IsOptional() @IsEnum(BudgetStatus) budgetStatus?: BudgetStatus;
  @IsOptional() @IsNumber() @Min(0) finalCost?: number;
}

export class AddPartDto {
  @IsString() @IsNotEmpty() inventoryItemId!: string;
  @IsNumber() @Min(1) quantity!: number;
}
