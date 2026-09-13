import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RECEPTIONIST')
  dashboard() { return this.analyticsService.dashboard(); }

  @Get('technicians')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  technicianReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.technicianReport(from, to);
  }
}
