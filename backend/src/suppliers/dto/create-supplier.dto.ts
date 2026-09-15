import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EmptyToUndefined } from '../../common/empty-to-undefined';

export class CreateSupplierDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() phone?: string;
  @EmptyToUndefined() @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() notes?: string;
}
