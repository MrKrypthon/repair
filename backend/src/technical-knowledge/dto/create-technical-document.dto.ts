import { TechnicalDocumentCategory } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTechnicalDocumentDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsEnum(TechnicalDocumentCategory) category!: TechnicalDocumentCategory;
  @IsOptional() @IsString() deviceBrand?: string;
  @IsOptional() @IsString() deviceModel?: string;
  @IsString() @IsNotEmpty() description!: string;
  @IsOptional() @IsString() keywords?: string;
  @IsOptional() @IsString() fileUrl?: string;
}
