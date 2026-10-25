import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { CartItem, WishlistItem } from "./entities/cart.entity";
import { Product, Variant } from "../catalog/entities/catalog.entity";
import { Inventory } from "../inventory/entities/inventory.entity";
import { PageQuery, paginate } from "../../common/api";
import { CatalogService } from "../catalog/catalog.service";

export async function lockCart(m: EntityManager, userId: string) {
  await m.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
    `cart:${userId}`,
  ]);
}
@Injectable()
export class CartService {
  constructor(
    private db: DataSource,
    private catalog: CatalogService,
  ) {}
  async get(userId: string) {
    const items = await this.db
      .getRepository(CartItem)
      .createQueryBuilder("i")
      .innerJoinAndSelect("i.variant", "v")
      .innerJoinAndSelect("v.product", "p")
      .where("i.userId = :userId", { userId })
      .orderBy("i.id", "ASC")
      .take(100)
      .getMany();
    return {
      items,
      currency: "BDT",
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotalMinor: items.reduce(
        (sum, i) => sum + i.quantity * i.variant.priceMinor,
        0,
      ),
    };
  }
  async put(userId: string, variantId: string, quantity: number) {
    return this.db.transaction(async (m) => {
      await lockCart(m, userId);
      const variant = await m.findOne(Variant, {
        where: { id: variantId, active: true },
        relations: { product: { category: true } },
      });
      if (
        !variant ||
        variant.product.status !== "published" ||
        !variant.product.category.active
      )
        throw new NotFoundException("Variant is unavailable");
      const stock = await m.findOneBy(Inventory, { variantId });
      if (!stock || stock.available < quantity)
        throw new ConflictException("OUT_OF_STOCK");
      const existing = await m.findOneBy(CartItem, { userId, variantId });
      if (!existing && (await m.countBy(CartItem, { userId })) >= 100)
        throw new BadRequestException("Cart supports at most 100 variants");
      return m.save(
        CartItem,
        m.create(CartItem, {
          ...(existing || {}),
          userId,
          variantId,
          quantity,
        }),
      );
    });
  }
  async remove(userId: string, variantId?: string) {
    await this.db.transaction(async (m) => {
      await lockCart(m, userId);
      await m.delete(CartItem, { userId, ...(variantId ? { variantId } : {}) });
    });
    return { removed: true };
  }
  async wishlist(userId: string, query: PageQuery) {
    const page = await paginate(
      this.db
        .getRepository(WishlistItem)
        .createQueryBuilder("w")
        .innerJoinAndSelect("w.product", "p")
        .innerJoin("p.category", "c")
        .where(
          `w.userId = :userId AND p.status = 'published' AND c.active = true`,
          { userId },
        ),
      query,
      `wishlist:${userId}`,
    );
    const products = await this.catalog.project(
      page.data.map((item) => item.product),
      false,
    );
    const map = new Map(products.map((p) => [p.id, p]));
    return {
      ...page,
      data: page.data.map((item) => ({
        ...item,
        product: map.get(item.productId),
      })),
    };
  }
  async wish(userId: string, productId: string, add: boolean) {
    if (add) {
      if (
        !(await this.db
          .getRepository(Product)
          .existsBy({ id: productId, status: "published" }))
      )
        throw new NotFoundException();
      if (
        (await this.db.getRepository(WishlistItem).countBy({ userId })) >= 500
      )
        throw new BadRequestException("Wishlist limit reached");
      await this.db
        .getRepository(WishlistItem)
        .createQueryBuilder()
        .insert()
        .values({ userId, productId })
        .orIgnore()
        .execute();
    } else
      await this.db.getRepository(WishlistItem).delete({ userId, productId });
    return { saved: add };
  }
}
