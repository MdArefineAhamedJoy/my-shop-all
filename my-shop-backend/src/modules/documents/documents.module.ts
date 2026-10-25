import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { DocumentsController } from "./documents.controller";
@Module({ imports: [OrdersModule], controllers: [DocumentsController] })
export class DocumentsModule {}
