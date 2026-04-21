import ClassicBanner from "@/components/shop/ClassicBanner";
import Image from "next/image";
import Link from "next/link";

const arrivalCategories = [
  {
    id: "arrival-men",
    name: "Men Arrivals",
    image:
      "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1964&auto=format&fit=crop",
    href: "/men?tag=new-arrival",
    subtitle: "Modern Classics",
  },
  {
    id: "arrival-women",
    name: "Women Arrivals",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
    href: "/women?tag=new-arrival",
    subtitle: "Elegant Styles",
  },
  {
    id: "arrival-accessories",
    name: "Accessories",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
    href: "/shop?category=accessories&tag=new-arrival",
    subtitle: "Final Touches",
  },
  {
    id: "arrival-others",
    name: "New Archive",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
    href: "/shop?tag=new-arrival",
    subtitle: "The Collection",
  },
];

const ArrivalGrid = () => {
  return (
    <div className="container pt-4 pb-32">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {arrivalCategories.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className="group relative h-[500px] md:h-[600px] overflow-hidden rounded-sm bg-gray-900"
          >
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span className="text-[10px] uppercase tracking-[0.5em] mb-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                {cat.subtitle}
              </span>
              <h3 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-center px-4">
                {cat.name}
              </h3>
              <div className="mt-8 h-px w-12 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default function NewArrivalsPage() {
  return (
    <main
      className="bg-white"
      style={{ paddingTop: "var(--header-height, 0px)" }}
    >
      <ClassicBanner
        title="Newest Arrivals"
        subtitle="The latest pieces from our 2026 archive"
        backgroundImage="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop"
        height="h-[60vh]"
      />

      {/* Selection Header - Ensuring High Visibility */}
      <div className="text-center py-20 px-4 bg-white">
        <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-orange-600 mb-3 block">
          Just Dropped
        </span>
        <h2 className="text-3xl md:text-5xl font-serif font-medium text-black tracking-tighter leading-none mb-4">
          Select Archive Selection<span className="text-orange-600">.</span>
        </h2>
        <p className="text-gray-500 text-sm max-w-lg mx-auto italic font-serif">
          Choose a section to explore our newest pieces crafted for the modern
          era.
        </p>
      </div>

      <ArrivalGrid />
    </main>
  );
}
