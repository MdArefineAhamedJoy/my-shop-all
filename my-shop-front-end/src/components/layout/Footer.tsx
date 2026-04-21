"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoTwitter,
  IoLogoYoutube,
} from "react-icons/io5";

const Footer: React.FC = () => {
  const pathname = usePathname();
  if (pathname === "/checkout") return null;

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-white">MY</span>
              <span className="text-orange-500">SHOP</span>
            </h3>
            <p className="text-gray-400 mb-4">
              Your destination for premium fashion and lifestyle clothing.
              Quality meets style.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors"
              >
                <IoLogoFacebook size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors"
              >
                <IoLogoInstagram size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors"
              >
                <IoLogoTwitter size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors"
              >
                <IoLogoYoutube size={20} />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/men"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Men&apos;s Clothing
                </Link>
              </li>
              <li>
                <Link
                  href="/women"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Women&apos;s Clothing
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?tag=new-arrival"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?tag=bestseller"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?tag=sale"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Information</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/track-order"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Track Order
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link
                  href="/size-guide"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Size Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2026 MyShop. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">We accept:</span>
              <div className="flex gap-2">
                <div className="bg-white px-3 py-1 rounded text-xs font-semibold text-gray-900">
                  VISA
                </div>
                <div className="bg-white px-3 py-1 rounded text-xs font-semibold text-gray-900">
                  MC
                </div>
                <div className="bg-white px-3 py-1 rounded text-xs font-semibold text-gray-900">
                  AMEX
                </div>
                <div className="bg-white px-3 py-1 rounded text-xs font-semibold text-gray-900">
                  bKash
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
