import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

interface KajabiCourse {
  id: string;
  title: string;
  description?: string;
  url?: string;
}

@Injectable()
export class KajabiService {
  private readonly logger = new Logger(KajabiService.name);
  private readonly apiKey = process.env.KAJABI_API_KEY || process.env.EXPO_PUBLIC_KAJABI_API_KEY;
  private readonly apiSecret = process.env.KAJABI_API_SECRET || process.env.EXPO_PUBLIC_KAJABI_API_SECRET;
  private readonly baseUrl = process.env.KAJABI_BASE_URL || 'https://api.kajabi.com';

  async getCourses(): Promise<KajabiCourse[]> {
    if (!this.apiKey) {
      this.logger.warn('Kajabi API key is not set');
      return [];
    }

    try {
      // Kajabi uses basic auth with API key/secret for v1 API — use appropriate auth per your account
      const resp = await fetch(`${this.baseUrl}/v1/products`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`,
          Accept: 'application/json',
        },
      });

      if (!resp.ok) {
        this.logger.error(`Kajabi API error: ${resp.status} ${resp.statusText}`);
        return [];
      }

      const data = await resp.json();

      // Normalize response to minimal course shape
      const courses: KajabiCourse[] = (data || []).map((p: any) => ({
        id: String(p.id || p.handle || p.slug || p.title),
        title: p.title || p.name || p.handle,
        description: p.description || p.summary || '',
        url: p.url || p.public_path || undefined,
      }));

      return courses;
    } catch (error) {
      this.logger.error('Error fetching Kajabi products', error as any);
      return [];
    }
  }
}
