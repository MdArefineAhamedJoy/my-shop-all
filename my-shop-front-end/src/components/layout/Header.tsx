"use client";

import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  IoCartOutline,
  IoChevronDown,
  IoHeartOutline,
  IoMenuOutline,
  IoPersonOutline,
  IoSearchOutline,
} from "react-icons/io5";

import { usePathname } from "next/navigation";
import MobileMenu from "./MobileMenu";

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const pathname = usePathname();

  // Determine if we are on the main shop route where we want a relative header
  const isShopRoute = pathname === "/shop";

  // Header ref to measure height
  const headerRef = React.useRef<HTMLElement>(null);

  const {
    cart,
    wishlist,
    setMobileMenuOpen,
    setWishlistOpen,
    setMiniCartOpen,
  } = useStore();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate header height using CSS variable
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        // Use getBoundingClientRect for sub-pixel precision if needed
        const height = headerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty(
          "--header-height",
          `${height}px`,
        );
      }
    };

    updateHeaderHeight();

    // Create a series of checks to handle the transition duration
    const interval = setInterval(updateHeaderHeight, 50);
    const timeout = setTimeout(() => clearInterval(interval), 400);

    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isScrolled]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop", hasMegaMenu: true },
    { label: "Men", href: "/men" },
    { label: "Women", href: "/women" },
    { label: "New", href: "/new-arrivals" },
    { label: "Sale", href: "/shop?tag=sale" },
  ];

  if (pathname === "/checkout") return null;

  return (
    <>
      <header
        ref={headerRef}
        className={`${isShopRoute ? "relative" : "fixed top-0"} w-full z-40 flex flex-col transition-[background-color,box-shadow,backdrop-filter,transform] duration-300`}
      >
        {/* Main Header */}
        <div
          className={`w-full transition-[background-color,box-shadow,backdrop-filter,transform,padding] duration-300 ${
            isScrolled
              ? "bg-white/90 backdrop-blur-md shadow-md py-3"
              : "bg-white py-4 md:py-5"
          }`}
        >
          <div className="container">
            <div className="flex items-center justify-between gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <IoMenuOutline size={28} />
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center">
                <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
                  <span className="text-gray-900">MY</span>
                  <span className="text-orange-500">SHOP</span>
                </h1>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                  <div key={link.href} className="relative group">
                    <Link
                      href={link.href}
                      className="text-base font-semibold text-gray-900 hover:text-orange-500 transition-colors flex items-center gap-1 relative py-2"
                      onMouseEnter={() =>
                        link.hasMegaMenu && setShowMegaMenu(true)
                      }
                    >
                      {link.label}
                      {link.hasMegaMenu && <IoChevronDown size={16} />}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300" />
                    </Link>
                  </div>
                ))}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden md:block text-gray-700"
                  aria-label="Search"
                >
                  <IoSearchOutline size={24} />
                </button>

                <button
                  onClick={() => setWishlistOpen(true)}
                  className="relative p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700"
                  aria-label="Wishlist"
                >
                  <IoHeartOutline size={24} />

                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setMiniCartOpen(true)}
                  className="relative p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700"
                  aria-label="Shopping cart"
                >
                  <IoCartOutline size={24} />

                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </button>

                <Link
                  href="/login"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden md:block text-gray-700"
                  aria-label="Account"
                >
                  <IoPersonOutline size={24} />
                </Link>
              </div>
            </div>
          </div>

          {/* Mega Menu */}
          {showMegaMenu && (
            <div
              className="absolute top-full left-0 w-full bg-white shadow-lg py-8 border-t"
              onMouseLeave={() => setShowMegaMenu(false)}
            >
              <div className="container">
                <div className="grid grid-cols-4 gap-8">
                  <div>
                    <h3 className="font-bold text-lg mb-4 text-gray-900">
                      Men&apos;s Clothing
                    </h3>
                    <ul className="space-y-3">
                      <li>
                        <Link
                          href="/shop?category=shirt&gender=men"
                          className="text-gray-600 hover:text-orange-500 transition-colors block"
                        >
                          Shirts
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/shop?category=pants&gender=men"
                          className="text-gray-600 hover:text-orange-500 transition-colors block"
                        >
                          Pants
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/shop?category=accessory&gender=men"
                          className="text-gray-600 hover:text-orange-500 transition-colors block"
                        >
                          Accessories
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-4 text-gray-900">
                      Women&apos;s Clothing
                    </h3>
                    <ul className="space-y-3">
                      <li>
                        <Link
                          href="/shop?category=shirt&gender=women"
                          className="text-gray-600 hover:text-orange-500 transition-colors block"
                        >
                          Tops & Shirts
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/shop?category=pants&gender=women"
                          className="text-gray-600 hover:text-orange-500 transition-colors block"
                        >
                          Pants & Skirts
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/shop?category=accessory&gender=women"
                          className="text-gray-600 hover:text-orange-500 transition-colors block"
                        >
                          Accessories
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-4 text-gray-900">
                      Collections
                    </h3>
                    <ul className="space-y-3">
                      <li>
                        <Link
                          href="/shop?tag=new-arrival"
                          className="text-gray-600 hover:text-orange-500 transition-colors block"
                        >
                          New Arrivals
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/shop?tag=trending"
                          className="text-gray-600 hover:text-orange-500 transition-colors block"
                        >
                          Trending
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/shop?tag=bestseller"
                          className="text-gray-600 hover:text-orange-500 transition-colors block"
                        >
                          Best Sellers
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-4 text-gray-900">
                      Shop By Price
                    </h3>
                    <ul className="space-y-3">
                      <li>
                        <Link
                          href="/shop?priceMax=1000"
                          className="text-gray-600 hover:text-orange-500 transition-colors block"
                        >
                          Under 1000 BDT
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/shop?priceMax=2500"
                          className="text-gray-600 hover:text-orange-500 transition-colors block"
                        >
                          Under 2500 BDT
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/shop?priceMax=5000"
                          className="text-gray-600 hover:text-orange-500 transition-colors block"
                        >
                          Under 5000 BDT
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <MobileMenu />
    </>
  );
};

export default Header;
