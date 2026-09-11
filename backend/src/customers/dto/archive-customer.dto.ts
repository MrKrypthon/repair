import { IsBoolean } from 'class-validator';

export class ArchiveCustomerDto {
  @IsBoolean()
  active!: boolean;
}
