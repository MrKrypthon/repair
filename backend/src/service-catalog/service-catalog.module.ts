import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ServiceCatalogController } from './service-catalog.controller';
import { ServiceCatalogService } from './service-catalog.service';

@Module({ imports: [AuthModule], controllers: [ServiceCatalogController], providers: [ServiceCatalogService] })
export class ServiceCatalogModule {}
