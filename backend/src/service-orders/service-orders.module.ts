import { Module } from '@nestjs/common';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrdersService } from './service-orders.service';
import { PublicTrackingController } from './public-tracking.controller';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuthModule], controllers: [ServiceOrdersController, PublicTrackingController], providers: [ServiceOrdersService] })
export class ServiceOrdersModule {}
