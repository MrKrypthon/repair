import { InventoryMovementType } from '@prisma/client';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString() @MinLength(1) name!: string;
  @IsString() @MinLength(1) sku!: string;
  @IsString() @MinLength(1) category!: string;
  @IsNumber() @Min(0) cost!: number;
  @IsNumber() @Min(0) salePrice!: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsInt() @Min(0) minimumStock?: number;
  @IsOptional() @IsString() supplierId?: string;
}

export class StockChangeDto {
  @IsEnum(InventoryMovementType) type!: InventoryMovementType;
  @IsInt() @Min(1) quantity!: number;
  @IsOptional() @IsString() note?: string;
}
