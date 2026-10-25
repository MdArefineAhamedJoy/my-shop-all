import { BadGatewayException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { decimalMinor, SslcommerzClient } from "./sslcommerz.client";
describe("SSLCommerz transport", () => {
  afterEach(() => jest.restoreAllMocks());
  it("converts decimal amounts exactly and rejects malformed or imprecise amounts", () => {
    expect(decimalMinor("123.09")).toBe(12309);
    expect(decimalMinor("10")).toBe(1000);
    for (const value of ["-1", "1.001", "1e3", "NaN", " 10", "1,000"])
      expect(() => decimalMinor(value)).toThrow();
  });
  it("uses a fixed TLS provider origin and rejects an injected checkout host", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "SUCCESS",
          GatewayPageURL: "https://attacker.example/pay",
        }),
        { status: 200 },
      ),
    );
    const client = new SslcommerzClient(
      new ConfigService({
        SSLCOMMERZ_STORE_ID: "test",
        SSLCOMMERZ_STORE_PASSWORD: "secret",
        SSLCOMMERZ_SANDBOX: "true",
      }),
    );
    await expect(client.initialize({ tran_id: "test" })).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    );
  });
});
