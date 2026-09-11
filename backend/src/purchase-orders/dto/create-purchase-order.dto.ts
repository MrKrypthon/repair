import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseLineDto {
  @IsString() @IsNotEmpty() inventoryItemId!: string;
  @IsInt() @Min(1) quantity!: number;
  @IsNumber() @Min(0) unitCost!: number;
}

export class CreatePurchaseOrderDto {
  @IsString() @IsNotEmpty() supplierId!: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PurchaseLineDto) lines!: PurchaseLineDto[];
}
