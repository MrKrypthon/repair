import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { PublicBudgetDto } from './dto/public-budget.dto';

@Controller('public/tracking')
export class PublicTrackingController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Get(':token')
  find(@Param('token') token: string) {
    return this.serviceOrdersService.publicTracking(token);
  }

  @Patch(':token/budget')
  updateBudget(@Param('token') token: string, @Body() body: PublicBudgetDto) {
    return this.serviceOrdersService.publicBudget(token, body.budgetStatus);
  }
}
