import { IsIn } from 'class-validator';

export class UpdateQuotationStatusDto {
  @IsIn(['SENT', 'APPROVED', 'REJECTED'])
  status!: 'SENT' | 'APPROVED' | 'REJECTED';
}
