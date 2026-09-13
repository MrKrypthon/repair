import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { CustomersModule } from './customers/customers.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';
import { InventoryModule } from './inventory/inventory.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { TechnicalKnowledgeModule } from './technical-knowledge/technical-knowledge.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { FinanceModule } from './finance/finance.module';
import { SearchModule } from './search/search.module';
import { QuotationsModule } from './quotations/quotations.module';

@Module({
  imports: [PrismaModule, StorageModule, AuthModule, CustomersModule, ServiceOrdersModule, PaymentsModule, InventoryModule, AppointmentsModule, TechnicalKnowledgeModule, AnalyticsModule, NotificationsModule, UsersModule, SuppliersModule, PurchaseOrdersModule, FinanceModule, SearchModule, QuotationsModule]
})
export class AppModule {}
