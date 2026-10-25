import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, In } from "typeorm";
import { Category, Product, Variant } from "./entities/catalog.entity";
import { Inventory } from "../inventory/entities/inventory.entity";
import {
  CreateProductDto,
  ProductQuery,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateVariantDto,
  VariantDto,
  CategoryDto,
} from "./dto/catalog.dto";
import { canonical, paginate } from "../../common/api";
import { PlatformService } from "../platform/platform.service";
import { Collection } from "../content/entities/content.entity";

@Injectable()
export class CatalogService {
  constructor(
    private db: DataSource,
    private platform: PlatformService,
  ) {}
  async list(query: ProductQuery, admin = false) {
    const qb = this.db
      .getRepository(Product)
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.category", "category");
    if (!admin) qb.where(`p.status = 'published' AND category.active = true`);
    else if (query.status)
      qb.andWhere("p.status = :status", { status: query.status });
    if (query.categoryId) qb.andWhere("p.categoryId = :categoryId", query);
    if (query.category) qb.andWhere("category.slug = :category", query);
    if (query.gender)
      qb.andWhere("p.gender IN (:...genders)", {
        genders:
          query.gender === "unisex" ? ["unisex"] : [query.gender, "unisex"],
      });
    if (query.q)
      qb.andWhere(
        `to_tsvector('simple', p.name || ' ' || p.description) @@ plainto_tsquery('simple', :q)`,
        { q: query.q },
      );
    if (query.tag === "new-arrival")
      qb.andWhere(
        "(p.is_new = true OR p.tags @> ARRAY['new-arrival']::text[])",
      );
    else if (query.tag === "sale")
      qb.andWhere(
        "EXISTS (SELECT 1 FROM variants sv WHERE sv.product_id=p.id AND sv.active=true AND sv.compare_at_minor>sv.price_minor)",
      );
    else if (query.tag)
      qb.andWhere("p.tags @> ARRAY[:tag]::text[]", { tag: query.tag });
    if (query.collectionId) {
      const collection = await this.db
        .getRepository(Collection)
        .findOneBy({ id: query.collectionId, active: true });
      if (!collection?.productIds.length)
        return { data: [], meta: { hasMore: false, nextCursor: null } };
      qb.andWhere("p.id IN (:...members)", { members: collection.productIds });
    }
    const sq = this.db
      .getRepository(Variant)
      .createQueryBuilder("v")
      .select("1")
      .where("v.productId = p.id AND v.active = true");
    if (query.minPriceMinor !== undefined)
      sq.andWhere("v.priceMinor >= :minPriceMinor", query);
    if (query.maxPriceMinor !== undefined)
      sq.andWhere("v.priceMinor <= :maxPriceMinor", query);
    if (query.size) sq.andWhere("v.size = :size", query);
    if (query.color) sq.andWhere("v.color = :color", query);
    if (
      !admin ||
      query.minPriceMinor !== undefined ||
      query.maxPriceMinor !== undefined ||
      query.size ||
      query.color
    )
      qb.andWhere(`EXISTS (${sq.getQuery()})`, sq.getParameters());
    const page = await paginate(
      qb,
      query,
      canonical({ ...query, cursor: undefined, limit: undefined, admin }),
    );
    return { ...page, data: await this.project(page.data, admin) };
  }
  async project(products: Product[], admin: boolean) {
    if (!products.length) return [];
    const variants = await this.db.getRepository(Variant).find({
      where: {
        productId: In(products.map((p) => p.id)),
        ...(admin ? {} : { active: true }),
      },
      order: { priceMinor: "ASC", id: "ASC" },
    });
    const stocks = variants.length
      ? await this.db
          .getRepository(Inventory)
          .findBy({ variantId: In(variants.map((v) => v.id)) })
      : [];
    const stockMap = new Map(stocks.map((s) => [s.variantId, s.available]));
    const grouped = new Map<string, Variant[]>();
    for (const variant of variants)
      grouped.set(variant.productId, [
        ...(grouped.get(variant.productId) || []),
        variant,
      ]);
    return products.map((product) => {
      const rows = grouped.get(product.id) || [];
      return {
        ...product,
        currency: "BDT",
        priceFromMinor: rows.length
          ? Math.min(...rows.map((v) => v.priceMinor))
          : null,
        variants: rows.map((v) => ({
          ...v,
          availability:
            (stockMap.get(v.id) || 0) > 0 ? "in_stock" : "out_of_stock",
          maxOrderQuantity: Math.min(99, stockMap.get(v.id) || 0),
        })),
      };
    });
  }
  async detail(slugOrId: string, admin = false) {
    const qb = this.db
      .getRepository(Product)
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.category", "category");
    qb.where(admin ? "p.id = :value" : "p.slug = :value", { value: slugOrId });
    if (!admin)
      qb.andWhere(`p.status = 'published' AND category.active = true`);
    const product = await qb.getOne();
    if (!product) throw new NotFoundException("Product not found");
    return (await this.project([product], admin))[0];
  }
  async create(actorId: string, input: CreateProductDto) {
    this.validateImages(input.images);
    const { variants, ...fields } = input;
    return this.db.transaction(async (m) => {
      if (!(await m.existsBy(Category, { id: input.categoryId, active: true })))
        throw new BadRequestException("Active category is required");
      const product = await m.save(Product, m.create(Product, fields));
      for (const variant of variants) {
        const row = await m.save(
          Variant,
          m.create(Variant, { ...variant, productId: product.id }),
        );
        await m.save(Inventory, m.create(Inventory, { variantId: row.id }));
      }
      await this.platform.audit(m, actorId, "product.create", product.id);
      return product;
    });
  }
  async update(actorId: string, id: string, input: UpdateProductDto) {
    if (input.images) this.validateImages(input.images);
    return this.db.transaction(async (m) => {
      const { expectedVersion, ...fields } = input;
      if (
        input.categoryId &&
        !(await m.existsBy(Category, { id: input.categoryId, active: true }))
      )
        throw new BadRequestException("Active category is required");
      const result = await m.update(
        Product,
        { id, version: expectedVersion },
        fields,
      );
      if (!result.affected)
        throw new ConflictException("Product missing or VERSION_CONFLICT");
      await this.platform.audit(m, actorId, "product.update", id, {
        fields: Object.keys(fields),
      });
      return m.findOneByOrFail(Product, { id });
    });
  }
  async setStatus(
    actorId: string,
    id: string,
    expectedVersion: number,
    status: "published" | "archived",
  ) {
    return this.db.transaction(async (m) => {
      const product = await m.findOne(Product, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!product) throw new NotFoundException();
      if (product.version !== expectedVersion)
        throw new ConflictException("VERSION_CONFLICT");
      if (
        status === "published" &&
        (!product.images.length ||
          !(await m.existsBy(Variant, { productId: id, active: true })) ||
          !(await m.existsBy(Category, {
            id: product.categoryId,
            active: true,
          })))
      )
        throw new BadRequestException(
          "Publishing requires images, an active category and active variants",
        );
      product.status = status;
      if (status === "published") product.publishedAt ??= new Date();
      await this.platform.audit(m, actorId, `product.${status}`, id);
      return m.save(product);
    });
  }
  async addVariant(actorId: string, id: string, input: VariantDto) {
    return this.db.transaction(async (m) => {
      if (!(await m.existsBy(Product, { id }))) throw new NotFoundException();
      const row = await m.save(
        Variant,
        m.create(Variant, { ...input, productId: id }),
      );
      await m.save(Inventory, m.create(Inventory, { variantId: row.id }));
      await this.platform.audit(m, actorId, "variant.create", row.id);
      return row;
    });
  }
  async updateVariant(actorId: string, id: string, input: UpdateVariantDto) {
    return this.db.transaction(async (m) => {
      const { expectedVersion, ...fields } = input;
      const result = await m.update(
        Variant,
        { id, version: expectedVersion },
        fields,
      );
      if (!result.affected)
        throw new ConflictException("Variant missing or VERSION_CONFLICT");
      await this.platform.audit(m, actorId, "variant.update", id, {
        fields: Object.keys(fields),
      });
      return m.findOneByOrFail(Variant, { id });
    });
  }
  categories(admin = false) {
    return this.db.getRepository(Category).find({
      where: admin ? {} : { active: true },
      order: { sortOrder: "ASC", id: "ASC" },
      take: 200,
    });
  }
  async createCategory(actorId: string, input: CategoryDto) {
    return this.db.transaction(async (m) => {
      const row = await m.save(Category, m.create(Category, input));
      await this.platform.audit(m, actorId, "category.create", row.id);
      return row;
    });
  }
  async updateCategory(actorId: string, id: string, input: UpdateCategoryDto) {
    return this.db.transaction(async (m) => {
      const { expectedVersion, ...fields } = input;
      const result = await m.update(
        Category,
        { id, version: expectedVersion },
        fields,
      );
      if (!result.affected)
        throw new ConflictException("Category missing or VERSION_CONFLICT");
      await this.platform.audit(m, actorId, "category.update", id);
      return m.findOneByOrFail(Category, { id });
    });
  }
  async deleteCategory(actorId: string, id: string) {
    return this.db.transaction(async (m) => {
      if (await m.existsBy(Product, { categoryId: id }))
        throw new ConflictException(
          "Category is referenced by products; deactivate it instead",
        );
      await m.delete(Category, id);
      await this.platform.audit(m, actorId, "category.delete", id);
      return { deleted: true };
    });
  }
  async related(id: string) {
    const product = await this.db
      .getRepository(Product)
      .findOneBy({ id, status: "published" });
    if (!product) throw new NotFoundException("Product not found");
    const rows = await this.db
      .getRepository(Product)
      .createQueryBuilder("p")
      .innerJoinAndSelect("p.category", "c")
      .where(
        `p.categoryId = :categoryId AND p.id <> :id AND p.status = 'published' AND c.active = true`,
        { categoryId: product.categoryId, id },
      )
      .orderBy("p.createdAt", "DESC")
      .addOrderBy("p.id", "DESC")
      .take(8)
      .getMany();
    return this.project(rows, false);
  }
  private validateImages(images: string[]) {
    for (const image of images) {
      const url = new URL(image);
      if (
        url.protocol !== "https:" &&
        (process.env.NODE_ENV === "production" ||
          !["localhost", "127.0.0.1"].includes(url.hostname))
      )
        throw new BadRequestException(
          "Images require HTTPS; local HTTP is allowed only in development",
        );
    }
  }
}
