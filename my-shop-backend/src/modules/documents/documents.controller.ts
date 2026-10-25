import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Res,
} from "@nestjs/common";
import { ApiBearerAuth, ApiProduces, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import PDFDocument from "pdfkit";
import { CurrentUser, Permissions } from "../../common/security";
import { User } from "../users/entities/user.entity";
import { OrdersService } from "../orders/orders.service";
import { PlatformService } from "../platform/platform.service";
import { DataSource } from "typeorm";

@ApiTags("Invoices")
@ApiBearerAuth()
@Controller()
export class DocumentsController {
  constructor(
    private orders: OrdersService,
    private db: DataSource,
    private platform: PlatformService,
  ) {}
  @Get("orders/:id/invoice")
  @ApiProduces("application/pdf")
  async invoice(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    await this.send(id, user.id, res);
  }
  @Permissions("orders:read")
  @Get("admin/orders/:id/invoice")
  @ApiProduces("application/pdf")
  async adminInvoice(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    await this.db.transaction((m) =>
      this.platform.audit(m, user.id, "invoice.download", id),
    );
    await this.send(id, null, res);
  }
  private async send(id: string, userId: string | null, res: Response) {
    const order = await this.orders.detail(id, userId);
    if (order.status === "cancelled")
      throw new NotFoundException(
        "Invoice is unavailable for cancelled orders",
      );
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    // Buffer before writing headers so PDF generation errors remain normal API errors.
    const chunks: Buffer[] = [];
    const result = new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });
    const money = (n: number) => `BDT ${(n / 100).toFixed(2)}`;
    doc.fontSize(24).text("MyShop");
    doc.fontSize(16).text("Order invoice");
    doc
      .moveDown()
      .fontSize(10)
      .text(`Invoice: INV-${order.orderNumber}`)
      .text(`Date: ${order.createdAt.toISOString().slice(0, 10)}`)
      .text(`Order: ${order.orderNumber}`)
      .text("Payment method: Cash on delivery");
    doc
      .moveDown()
      .text(`Customer: ${order.shippingAddress.name}`)
      .text(order.shippingAddress.line1)
      .text(
        `${order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.countryCode}`,
      );
    doc.moveDown().fontSize(12).text("Items");
    for (const line of order.lines)
      doc
        .moveDown(0.5)
        .fontSize(10)
        .text(`${line.name} | ${line.sku} | ${line.size} / ${line.color}`)
        .text(
          `${line.quantity} x ${money(line.unitPriceMinor)} = ${money(line.quantity * line.unitPriceMinor)}`,
        );
    doc
      .moveDown()
      .text(`Subtotal: ${money(order.totals.subtotalMinor)}`)
      .text(`Discount: ${money(order.totals.discountMinor)}`)
      .text(`Shipping: ${money(order.totals.shippingMinor)}`)
      .text(`Tax: ${money(order.totals.taxMinor)}`)
      .fontSize(14)
      .text(`Total: ${money(order.totalMinor)}`);
    doc
      .moveDown()
      .fontSize(9)
      .text(
        "This order invoice is not a payment receipt. Refunds and collections are recorded separately.",
      );
    doc.end();
    const pdf = await result;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="INV-${order.orderNumber}.pdf"`,
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.send(pdf);
  }
}
