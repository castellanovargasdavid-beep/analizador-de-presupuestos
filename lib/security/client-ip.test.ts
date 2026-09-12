import { describe, expect, it } from "vitest";
import { clientIpFromHeaders } from "./rate-limit";

describe("clientIpFromHeaders", () => {
  it("usa el primer valor de x-forwarded-for cuando hay varios (cliente, proxies intermedios)", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.4, 10.0.0.1, 10.0.0.2" });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.4");
  });

  it("cae a x-real-ip si no hay x-forwarded-for", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.9" });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.9");
  });

  it("devuelve una clave fija sin ninguna cabecera de proxy (desarrollo local)", () => {
    const headers = new Headers();
    expect(clientIpFromHeaders(headers)).toBe("sin-proxy");
  });
});
