import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { EmptyToUndefined } from '../../common/empty-to-undefined';

export class UpdateCustomerDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(30) phone?: string;
  @EmptyToUndefined() @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() notes?: string;
}
