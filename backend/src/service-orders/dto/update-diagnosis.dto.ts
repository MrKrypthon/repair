import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateDiagnosisDto {
  @IsString() @IsOptional() diagnosis?: string;
  @IsString() @IsOptional() probableCause?: string;
  @IsObject() @IsOptional() testChecklist?: Record<string, boolean>;
}

export class DeliverOrderDto {
  @IsString()
  @IsOptional()
  note?: string;
}
