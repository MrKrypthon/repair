import { BudgetStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class PublicBudgetDto {
  @IsEnum(BudgetStatus)
  budgetStatus!: BudgetStatus;
}
