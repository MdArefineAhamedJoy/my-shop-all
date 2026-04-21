import ProductDetail from "@/components/product/ProductDetail";
import RelatedProductsSlider from "@/components/product/RelatedProductsSlider";
import { getProductBySlug, getProductsByCategory } from "@/lib/mockData";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Get related products from the same category, excluding the current product
  const relatedProducts = getProductsByCategory(product.category).filter(
    (p) => p.id !== product.id,
  );

  return (
    <main
      className="bg-white"
      style={{ paddingTop: "var(--header-height, 0px)" }}
    >
      <ProductDetail product={product} />

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="mt-32 pt-20 pb-40 border-t border-[#eeeeee]">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-16 uppercase tracking-[0.3em] text-[#1c1c1c] font-serif">
            Related Creations
          </h2>

          <RelatedProductsSlider products={relatedProducts} />
        </section>
      )}
    </main>
  );
}
