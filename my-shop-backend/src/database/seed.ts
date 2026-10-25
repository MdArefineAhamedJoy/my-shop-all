import "reflect-metadata";
import dataSource from "./data-source";
import { validateEnvironment } from "../config/environment";
import { encrypt, hashPassword, newTotpSecret } from "../modules/auth/crypto";
import { Role, User } from "../modules/users/entities/user.entity";
import {
  Category,
  Product,
  Variant,
} from "../modules/catalog/entities/catalog.entity";
import {
  Inventory,
  InventoryMovement,
} from "../modules/inventory/entities/inventory.entity";

async function seed() {
  validateEnvironment(process.env);
  await dataSource.initialize();
  try {
    if (await dataSource.showMigrations())
      throw new Error("Run npm run migration:run first");
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password || password.length < 12)
      throw new Error(
        "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (12+ characters) before seeding",
      );
    let enrollment: string | null = null;
    await dataSource.transaction(async (m) => {
      await m.query("SELECT pg_advisory_xact_lock(hashtextextended('seed',0))");
      let admin = await m.findOneBy(User, { email });
      if (admin && admin.role !== Role.ADMIN)
        throw new Error(
          "Refusing to promote an existing customer or staff account",
        );
      if (!admin) {
        const secret = newTotpSecret();
        admin = await m.save(
          User,
          m.create(User, {
            email,
            name: "Shop Administrator",
            role: Role.ADMIN,
            emailVerified: true,
            passwordHash: await hashPassword(password),
            mfaSecret: encrypt(secret, process.env.APP_ENCRYPTION_KEY!),
          }),
        );
        enrollment = `otpauth://totp/MyShop:${encodeURIComponent(email)}?secret=${secret}&issuer=MyShop`;
      }
      let category = await m.findOneBy(Category, { slug: "shirts" });
      category ??= await m.save(
        Category,
        m.create(Category, { name: "Shirts", slug: "shirts" }),
      );
      if (!(await m.existsBy(Product, { slug: "classic-cotton-shirt" }))) {
        const product = await m.save(
          Product,
          m.create(Product, {
            name: "Classic Cotton Shirt",
            slug: "classic-cotton-shirt",
            description: "Comfortable cotton shirt for everyday wear.",
            categoryId: category.id,
            gender: "unisex",
            status: "published",
            publishedAt: new Date(),
            images: [
              "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200",
            ],
            tags: ["cotton"],
            isFeatured: true,
          }),
        );
        for (const size of ["S", "M", "L"]) {
          const variant = await m.save(
            Variant,
            m.create(Variant, {
              productId: product.id,
              sku: `SHIRT-NAVY-${size}`,
              size,
              color: "navy",
              priceMinor: 129900,
            }),
          );
          await m.save(
            Inventory,
            m.create(Inventory, { variantId: variant.id, available: 25 }),
          );
          await m.save(
            InventoryMovement,
            m.create(InventoryMovement, {
              variantId: variant.id,
              quantity: 25,
              reason: "Development seed initial stock",
              actorId: admin.id,
            }),
          );
        }
      }
    });
    console.log(
      "Seed complete; existing accounts and inventory were preserved.",
    );
    if (enrollment)
      console.log(
        `ONE-TIME ADMIN MFA ENROLLMENT (store privately; scan/import into your authenticator):\n${enrollment}`,
      );
    else
      console.log(
        "Administrator already exists; its password and MFA have not been changed.",
      );
  } finally {
    await dataSource.destroy();
  }
}
void seed().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed failed");
  process.exitCode = 1;
});
