import { Injectable, Logger } from "@nestjs/common";
import fetch from "node-fetch";

interface KajabiProduct {
  id: string;
  title: string;
  description?: string;
  url?: string;
  thumbnail_url?: string;
  product_type_name?: string;
}

interface KajabiCustomer {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  public_bio?: string;
  public_location?: string;
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
  // client id/secret for oauth token exchange (may be provided as EXPO_PUBLIC_* or KAJABI_* vars)
  private readonly clientId =
    process.env.EXPO_PUBLIC_KAJABI_CLIENT_ID || process.env.KAJABI_API_KEY;
  private readonly clientSecret =
    process.env.EXPO_PUBLIC_KAJABI_CLIENT_SECRET ||
    process.env.KAJABI_API_SECRET;
  // in-memory cached token
  private cachedToken: { token: string; expiresAt: number } | null = null;
  private readonly baseUrl =
    process.env.KAJABI_BASE_URL || "https://api.kajabi.com";

  async getProducts(): Promise<KajabiProduct[]> {
    // Require either an api key+secret or a bearer token. support token-only flows.
    if (!this.apiKey && !this.apiToken) {
      this.logger.warn(
        "No Kajabi API credentials found (KAJABI_API_KEY/SECRET or KAJABI_API_TOKEN)"
      );
      return [];
    }

    try {
      const headers: any = { Accept: "application/json" };

      // Debug: indicate which auth method pieces are present (no secrets printed)
      this.logger.debug(
        `Kajabi auth config: token=${!!this.apiToken}, key=${!!this.apiKey}, secret=${!!this.apiSecret}, clientId=${!!this.clientId}`
      );

      // Helper: exchange client credentials for access token (cached)
      const getAccessToken = async (): Promise<string | null> => {
        // return explicit env token first
        if (this.apiToken) return this.apiToken;
        // use cached token if still valid
        if (this.cachedToken && Date.now() < this.cachedToken.expiresAt)
          return this.cachedToken.token;

        // need client id/secret to exchange
        if (!this.clientId || !this.clientSecret) return null;

        const body = new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }).toString();

        const tokenUrl = `${this.baseUrl.replace(/\/$/, "")}/v1/oauth/token`;
        const resp = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });

        if (!resp.ok) {
          this.logger.warn(
            `Failed to exchange Kajabi token: ${resp.status} ${resp.statusText}`
          );
          return null;
        }

        const json = await resp.json();
        if (!json || !json.access_token) return null;

        const expiresIn = Number(json.expires_in) || 300;
        this.cachedToken = {
          token: json.access_token,
          expiresAt: Date.now() + expiresIn * 1000,
        };
        this.logger.debug(
          `Obtained Kajabi access token, expires_in=${expiresIn}`
        );
        return this.cachedToken.token;
      };

      // prefer bearer token first (explicit env or exchanged)
      const maybeToken = await getAccessToken();
      if (maybeToken) headers.Authorization = `Bearer ${maybeToken}`;
      else if (this.apiKey && this.apiSecret) {
        headers.Authorization = `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString("base64")}`;
      } else {
        this.logger.warn(
          "No Kajabi auth configured (apiToken or client credentials)"
        );
        return [];
      }

      const pageSize = 100; // max page size to reduce requests
      let pageNumber = 1;
      const collected: KajabiProduct[] = [];

      while (true) {
        const url = `${this.baseUrl.replace(/\/$/, "")}/v1/products?page[number]=${pageNumber}&page[size]=${pageSize}`;
        let resp = await fetch(url, { method: "GET", headers });

        // If Basic auth returned 401 and a clientId/clientSecret exist, try exchanging token and retry once
        if (
          resp.status === 401 &&
          this.clientId &&
          this.clientSecret &&
          !headers.Authorization?.startsWith("Bearer")
        ) {
          this.logger.debug(
            "Basic auth rejected, attempting token exchange and retry"
          );
          const token = await getAccessToken();
          if (token) {
            headers.Authorization = `Bearer ${token}`;
            resp = await fetch(url, { method: "GET", headers });
          }
        }

        if (!resp.ok) {
          this.logger.error(
            `Kajabi API error: ${resp.status} ${resp.statusText} when fetching page ${pageNumber}`
          );
          break;
        }

        // Debug: log status for the first page request
        if (pageNumber === 1) {
          this.logger.debug(`Kajabi first page fetch status: ${resp.status}`);
        }

        const json = await resp.json();

        // Kajabi returns JSON:API-like envelope { data: [...] } or sometimes a raw array
        const items: any[] = Array.isArray(json) ? json : json.data || [];

        if (!items || items.length === 0) {
          // Debug: if first page is empty, log and break
          if (pageNumber === 1)
            this.logger.debug("Kajabi returned 0 items on first page");
          break;
        }

        if (pageNumber === 1)
          this.logger.debug(`Kajabi first page items: ${items.length}`);

        for (const p of items) {
          collected.push({
            id: String(p.id || p.handle || p.slug || p.title),
            title: p.title || p.name || p.handle || "",
            description:
              p.description || p.summary || p.attributes?.description || "",
            url: p.url || p.public_path || p.attributes?.url || undefined,
            thumbnail_url:
              p.thumbnail_url ||
              p.attributes?.thumbnail_url ||
              p.attributes?.image_url ||
              undefined,
            product_type_name:
              p.product_type_name ||
              p.attributes?.product_type_name ||
              undefined,
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

  // Fetch customers (members) from Kajabi and map to a lightweight shape
  async getCustomers(pageSize = 50, pageNumberStart = 1, search?: string): Promise<KajabiCustomer[]> {
    try {
      const headers: any = { Accept: 'application/json' };
      const getAccessToken = async (): Promise<string | null> => {
        if (this.apiToken) return this.apiToken;
        if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) return this.cachedToken.token;
        if (!this.clientId || !this.clientSecret) return null;

        const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: this.clientId, client_secret: this.clientSecret }).toString();
        const tokenUrl = `${this.baseUrl.replace(/\/$/, '')}/v1/oauth/token`;
        const resp = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        if (!resp.ok) return null;
        const json = await resp.json();
        if (!json || !json.access_token) return null;
        const expiresIn = Number(json.expires_in) || 300;
        this.cachedToken = { token: json.access_token, expiresAt: Date.now() + expiresIn * 1000 };
        return this.cachedToken.token;
      };

      const maybeToken = await getAccessToken();
      if (maybeToken) headers.Authorization = `Bearer ${maybeToken}`;
      else if (this.apiKey && this.apiSecret) headers.Authorization = `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`;
      else {
        this.logger.warn('No Kajabi auth available for customers');
        return [];
      }

      const collected: KajabiCustomer[] = [];
      let pageNumber = pageNumberStart;
      while (true) {
        const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/v1/customers`);
        url.searchParams.set('page[number]', String(pageNumber));
        url.searchParams.set('page[size]', String(pageSize));
        if (search) url.searchParams.set('filter[search]', search);

        const resp = await fetch(url.toString(), { method: 'GET', headers });
        if (!resp.ok) {
          this.logger.error(`Kajabi customers error: ${resp.status} ${resp.statusText} when fetching page ${pageNumber}`);
          break;
        }

        const json = await resp.json();
        const items: any[] = Array.isArray(json) ? json : json.data || [];
        if (!items || items.length === 0) break;

        for (const c of items) {
          collected.push({
            id: String(c.id),
            name: c.attributes?.name || c.attributes?.contact_name || undefined,
            email: c.attributes?.email || undefined,
            avatar: c.attributes?.avatar || c.attributes?.gravatar || undefined,
            public_bio: c.attributes?.public_bio || undefined,
            public_location: c.attributes?.public_location || undefined,
          });
        }

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
      this.logger.error('Error fetching Kajabi customers', error as any);
      return [];
    }
  }

  // Fetch a single Kajabi customer by id
  async getCustomerById(id: string): Promise<KajabiCustomer | null> {
    try {
      const headers: any = { Accept: 'application/json' };
      const getAccessToken = async (): Promise<string | null> => {
        if (this.apiToken) return this.apiToken;
        if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) return this.cachedToken.token;
        if (!this.clientId || !this.clientSecret) return null;

        const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: this.clientId, client_secret: this.clientSecret }).toString();
        const tokenUrl = `${this.baseUrl.replace(/\/$/, '')}/v1/oauth/token`;
        const resp = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        if (!resp.ok) return null;
        const json = await resp.json();
        if (!json || !json.access_token) return null;
        const expiresIn = Number(json.expires_in) || 300;
        this.cachedToken = { token: json.access_token, expiresAt: Date.now() + expiresIn * 1000 };
        return this.cachedToken.token;
      };

      const maybeToken = await getAccessToken();
      if (maybeToken) headers.Authorization = `Bearer ${maybeToken}`;
      else if (this.apiKey && this.apiSecret) headers.Authorization = `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`;
      else {
        this.logger.warn('No Kajabi auth available for customer detail');
        return null;
      }

      const url = `${this.baseUrl.replace(/\/$/, '')}/v1/customers/${encodeURIComponent(id)}`;
      const resp = await fetch(url, { method: 'GET', headers });
      if (!resp.ok) {
        this.logger.error(`Kajabi customer detail error: ${resp.status} ${resp.statusText}`);
        return null;
      }

      const json = await resp.json();
      // json may be { data: { id, attributes: {...} } } or direct object
      const c = json && json.data ? json.data : json;
      if (!c) return null;

      return {
        id: String(c.id),
        name: c.attributes?.name || c.attributes?.contact_name || c.name || undefined,
        email: c.attributes?.email || c.email || undefined,
        avatar: c.attributes?.avatar || c.attributes?.gravatar || c.avatar || undefined,
        public_bio: c.attributes?.public_bio || undefined,
        public_location: c.attributes?.public_location || undefined,
      };
    } catch (error) {
      this.logger.error('Error fetching Kajabi customer detail', error as any);
      return null;
    }
  }
}
