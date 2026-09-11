import { PaymentMethod, PaymentType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber() @Min(0.01) amount!: number;
  @IsEnum(PaymentMethod) method!: PaymentMethod;
  @IsEnum(PaymentType) type!: PaymentType;
  @IsOptional() @IsString() reference?: string;
}
