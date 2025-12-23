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
      const headers: any = { Accept: "application/json" };

      if (this.apiToken) {
        headers.Authorization = `Bearer ${this.apiToken}`;
      } else if (this.apiKey && this.apiSecret) {
        headers.Authorization = `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString("base64")}`;
      } else {
        this.logger.warn("No Kajabi auth configured (apiToken or apiKey+apiSecret)");
        return [];
      }

      const pageSize = 100; // max page size to reduce requests
      let pageNumber = 1;
      const collected: KajabiProduct[] = [];

      while (true) {
        const url = `${this.baseUrl.replace(/\/$/, "")}/v1/products?page[number]=${pageNumber}&page[size]=${pageSize}`;
        const resp = await fetch(url, { method: "GET", headers });

        if (!resp.ok) {
          this.logger.error(`Kajabi API error: ${resp.status} ${resp.statusText} when fetching page ${pageNumber}`);
          break;
        }

        const json = await resp.json();

        // Kajabi returns JSON:API-like envelope { data: [...] } or sometimes a raw array
        const items: any[] = Array.isArray(json) ? json : (json.data || []);

        if (!items || items.length === 0) break;

        for (const p of items) {
          collected.push({
            id: String(p.id || p.handle || p.slug || p.title),
            title: p.title || p.name || p.handle || "",
            description: p.description || p.summary || p.attributes?.description || "",
            url: p.url || p.public_path || p.attributes?.url || undefined,
          });
        }

        // If JSON includes links.next, follow it; otherwise stop when fewer than pageSize
        const hasNext = json && json.links && json.links.next;
        if (hasNext) {
          pageNumber++;
          continue;
        }

        if (items.length < pageSize) break;
        pageNumber++;
      }

      return collected;
    } catch (error) {
      this.logger.error("Error fetching Kajabi products", error as any);
      return [];
    }
  }
}
