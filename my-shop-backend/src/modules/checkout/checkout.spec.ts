import { calculateTotals, cartHash } from "./checkout.service";
describe("Server-side monetary policy", () => {
  it("calculates in integer minor units after discount, then shipping and tax", () => {
    expect(calculateTotals(259800, 10, 8000, 300000, 500)).toEqual({
      subtotalMinor: 259800,
      discountMinor: 25980,
      shippingMinor: 8000,
      taxMinor: 11691,
      totalMinor: 253511,
    });
  });
  it("uses discounted subtotal for free-shipping eligibility", () => {
    expect(calculateTotals(300000, 10, 8000, 300000, 0).shippingMinor).toBe(
      8000,
    );
    expect(calculateTotals(300000, 0, 8000, 300000, 0).shippingMinor).toBe(0);
  });
  it("rejects totals beyond the order limit", () => {
    expect(() => calculateTotals(2000000000, 0, 0, 0, 0)).toThrow();
  });
  it("binds a quote to cart quantities independent of row order", () => {
    expect(
      cartHash([
        { variantId: "b", quantity: 1 },
        { variantId: "a", quantity: 2 },
      ]),
    ).toBe(
      cartHash([
        { variantId: "a", quantity: 2 },
        { variantId: "b", quantity: 1 },
      ]),
    );
    expect(cartHash([{ variantId: "a", quantity: 1 }])).not.toBe(
      cartHash([{ variantId: "a", quantity: 2 }]),
    );
  });
});
