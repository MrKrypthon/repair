import { IsArray, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpdateDiagnosisDto {
  @IsString() @IsOptional() diagnosis?: string;
  @IsString() @IsOptional() probableCause?: string;
  @IsObject() @IsOptional() testChecklist?: Record<string, boolean>;
}

export class DeliverOrderDto {
  @IsString()
  @IsOptional()
  note?: string;

  @IsOptional() @IsInt() @Min(0) warrantyDays?: number;
}
