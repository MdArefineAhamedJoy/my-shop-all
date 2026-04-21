import FeaturedCollections from "@/components/home/FeaturedCollections";
import HeroSlider from "@/components/home/HeroSlider";
import Newsletter from "@/components/home/Newsletter";
import ProductGrid from "@/components/home/ProductGrid";
import { getProductsByTag } from "@/lib/mockData";

export default function HomePage() {
  const newArrivals = getProductsByTag("new-arrival", 4);
  const trending = getProductsByTag("trending", 4);
  const bestSellers = getProductsByTag("bestseller", 4);

  return (
    <div
      className="min-h-screen"
      style={{ paddingTop: "var(--header-height, 80px)" }}
    >
      {/* Hero Slider */}
      <HeroSlider />

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
