import FeaturedCollections from "@/components/home/FeaturedCollections";
import HeroSlider from "@/components/home/HeroSlider";
import Newsletter from "@/components/home/Newsletter";
import ProductGrid from "@/components/home/ProductGrid";
import { serverProducts } from "@/lib/server-catalog";

export default async function HomePage() {
  const products = await serverProducts();
  const storefrontResponse = await fetch(
    `${process.env.API_INTERNAL_URL || "http://127.0.0.1:4000/v1"}/storefront`,
    { cache: "no-store" },
  );
  const { data: storefront } = await storefrontResponse.json();
  const newArrivals = products.slice(0, 4);
  const trending = products
    .filter((p) => p.tags.includes("trending"))
    .slice(0, 4);
  const bestSellers = products
    .filter((p) => p.tags.includes("bestseller"))
    .slice(0, 4);

  return (
    <div
      className="min-h-screen"
      style={{ paddingTop: "var(--header-height, 80px)" }}
    >
      {/* Hero Slider */}
      {storefront.announcement && (
        <p className="bg-black text-white text-center p-2 text-sm">
          {storefront.announcement}
        </p>
      )}
      <HeroSlider banners={storefront.banners} />

      {/* Featured Collections */}
      <section className="py-16 md:py-20 bg-gray-50">
        <FeaturedCollections />
      </section>

      {/* New Arrivals */}
      <section className="py-16 md:py-20">
        <ProductGrid
          title="New Arrivals"
          subtitle="Fresh styles just dropped"
          products={newArrivals}
          viewAllLink="/shop?tag=new-arrival"
        />
      </section>

      {/* Trending Now */}
      <section className="py-16 md:py-20 bg-gray-50">
        <ProductGrid
          title="Trending Now"
          subtitle="What everyone is wearing"
          products={trending}
          viewAllLink="/shop?tag=trending"
        />
      </section>

      {/* Best Sellers */}
      <section className="py-16 md:py-20">
        <ProductGrid
          title="Best Sellers"
          subtitle="Our most loved pieces"
          products={bestSellers}
          viewAllLink="/shop?tag=bestseller"
        />
      </section>

      {/* Newsletter / Style Circle Hub */}
      <section className="h-[40vh] min-h-[400px] relative overflow-hidden bg-[#1c1c1c] border-y border-white/5">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent" />
        </div>
        <Newsletter />
      </section>
    </div>
  );
}
