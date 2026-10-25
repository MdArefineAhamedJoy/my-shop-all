import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { validateEnvironment } from "./config/environment";
import { databaseOptions } from "./database/data-source";
import { AuthGuard, RateLimitGuard } from "./common/security";
import { PlatformModule } from "./modules/platform/platform.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { CartModule } from "./modules/cart/cart.module";
import { CheckoutModule } from "./modules/checkout/checkout.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ReturnsModule } from "./modules/returns/returns.module";
import { PromotionsModule } from "./modules/promotions/promotions.module";
import { ContentModule } from "./modules/content/content.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { HealthModule } from "./modules/health/health.module";
import { MediaModule } from "./modules/media/media.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { SettingsModule } from "./modules/settings/settings.module";
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    TypeOrmModule.forRoot(databaseOptions),
    PlatformModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    InventoryModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    ReturnsModule,
    PromotionsModule,
    ContentModule,
    ReportsModule,
    HealthModule,
    MediaModule,
    DocumentsModule,
    SettingsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
