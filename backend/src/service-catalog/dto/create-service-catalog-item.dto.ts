import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceCatalogItemDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) cost?: number;
  @IsNumber() @Min(0) price!: number;
}

export class UpdateServiceCatalogItemDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) cost?: number;
  @IsOptional() @IsNumber() @Min(0) price?: number;
}

export class ArchiveServiceCatalogItemDto {
  @IsBoolean() active!: boolean;
}
