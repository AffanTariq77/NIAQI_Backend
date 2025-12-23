import { Injectable, Logger } from "@nestjs/common";
import fetch from "node-fetch";

interface KajabiProduct {
  id: string;
  title: string;
  description?: string;
  url?: string;
}

@Injectable()
export class KajabiService {
  private readonly logger = new Logger(KajabiService.name);
  private readonly apiKey =
    process.env.KAJABI_API_KEY || process.env.EXPO_PUBLIC_KAJABI_API_KEY;
  private readonly apiSecret =
    process.env.KAJABI_API_SECRET || process.env.EXPO_PUBLIC_KAJABI_API_SECRET;
  // Support bearer token (newer Kajabi auth) - set KAJABI_API_TOKEN in environment
  private readonly apiToken =
    process.env.KAJABI_API_TOKEN || process.env.EXPO_PUBLIC_KAJABI_API_TOKEN;
  private readonly baseUrl =
    process.env.KAJABI_BASE_URL || "https://api.kajabi.com";

  async getProducts(): Promise<KajabiProduct[]> {
    if (!this.apiKey) {
      this.logger.warn("Kajabi API key is not set");
      return [];
    }

    try {
      const url = `${this.baseUrl.replace(/\/$/, "")}/v1/products`;
      const headers: any = { Accept: "application/json" };

      if (this.apiToken) {
        // Use Bearer token when available
        headers.Authorization = `Bearer ${this.apiToken}`;
      } else if (this.apiKey && this.apiSecret) {
        // Fallback to Basic auth
        headers.Authorization = `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString("base64")}`;
      } else {
        this.logger.warn(
          "No Kajabi auth configured (apiToken or apiKey+apiSecret)"
        );
        return [];
      }

      const resp = await fetch(url, { method: "GET", headers });

      if (!resp.ok) {
        this.logger.error(
          `Kajabi API error: ${resp.status} ${resp.statusText}`
        );
        return [];
      }

      const data = await resp.json();

      // Normalize response to minimal product shape
      const products: KajabiProduct[] = (data || []).map((p: any) => ({
        id: String(p.id || p.handle || p.slug || p.title),
        title: p.title || p.name || p.handle,
        description: p.description || p.summary || "",
        url: p.url || p.public_path || undefined,
      }));

      return products;
    } catch (error) {
      this.logger.error("Error fetching Kajabi products", error as any);
      return [];
    }
  }
}
