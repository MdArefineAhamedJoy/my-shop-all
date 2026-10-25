import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsISO8601, IsOptional } from "class-validator";
import { DataSource } from "typeorm";
import { Permissions } from "../../common/security";
import { PageQuery, paginate } from "../../common/api";
import { AuditLog } from "../platform/entities/platform.entity";
class ReportQuery {
  @ApiPropertyOptional({
    description: "Inclusive UTC instant, defaults to 30 days ago",
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  from?: string;
  @ApiPropertyOptional({ description: "Exclusive UTC instant" })
  @IsOptional()
  @IsISO8601({ strict: true })
  to?: string;
}
@ApiTags("Admin / Reports & Audit")
@ApiBearerAuth()
@Controller("admin")
export class ReportsController {
  constructor(private db: DataSource) {}
  @Permissions("reports:read") @Get("reports/overview") async overview(
    @Query() query: ReportQuery,
  ) {
    const from = query.from
      ? new Date(query.from)
      : new Date(Date.now() - 30 * 86400000);
    const to = query.to ? new Date(query.to) : new Date();
    if (to <= from || to.getTime() - from.getTime() > 366 * 86400000)
      throw new BadRequestException(
        "Report range must be positive and at most 366 days",
      );
    const [totals] = await this.db.query(
      `SELECT count(*)::integer AS "ordersPlaced", count(*) FILTER (WHERE status='cancelled')::integer AS "cancelledOrders", count(*) FILTER (WHERE status='delivered')::integer AS "deliveredOrders", coalesce(sum(total_minor) FILTER (WHERE status <> 'cancelled'),0)::text AS "orderedMinor" FROM orders WHERE created_at >= $1 AND created_at < $2`,
      [from, to],
    );
    const [collections] = await this.db.query(
      'SELECT coalesce(sum(amount_minor),0)::text AS "collectedMinor" FROM payments WHERE collected_at >= $1 AND collected_at < $2',
      [from, to],
    );
    const [refunds] = await this.db.query(
      'SELECT coalesce(sum(amount_minor),0)::text AS "refundedMinor" FROM refunds WHERE created_at >= $1 AND created_at < $2',
      [from, to],
    );
    const daily = await this.db.query(
      `SELECT to_char(created_at AT TIME ZONE 'Asia/Dhaka','YYYY-MM-DD') AS day, count(*)::integer AS orders, coalesce(sum(total_minor) FILTER (WHERE status <> 'cancelled'),0)::text AS "orderedMinor" FROM orders WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 1`,
      [from, to],
    );
    return {
      from,
      to,
      currency: "BDT",
      timezone: "Asia/Dhaka",
      refreshedAt: new Date(),
      definitions: {
        orderedMinor: "Non-cancelled orders placed in period; not revenue",
        collectedMinor: "COD money with collectedAt in period",
        refundedMinor: "Recorded refunds created in period",
        aggregateMoney: "Decimal strings avoid integer precision loss",
      },
      ...totals,
      ...collections,
      ...refunds,
      daily,
    };
  }
  @Permissions("audit:read") @Get("audit-logs") audit(
    @Query() query: PageQuery,
  ) {
    return paginate(
      this.db.getRepository(AuditLog).createQueryBuilder("a"),
      query,
      "audit",
    );
  }
}
