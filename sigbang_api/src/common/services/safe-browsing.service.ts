import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ThreatMatch = {
  threatType?: string;
  platformType?: string;
  threatEntryType?: string;
  threat?: { url?: string };
  cacheDuration?: string;
};

type ThreatMatchesResponse = {
  matches?: ThreatMatch[];
};

@Injectable()
export class SafeBrowsingService {
  private readonly logger = new Logger(SafeBrowsingService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns a list of threat types for the given URL (empty array means "no match" or "check unavailable").
   *
   * Uses Safe Browsing API v4 threatMatches:find.
   */
  async findThreatTypes(url: string): Promise<string[]> {
    const apiKey = 'AIzaSyCtHhvwqMziq2Rvd8-BvM8mld0o2A0lgYI';
    if (!apiKey) {
      this.logger.warn(`safebrowing key empty`);
      return [];
    }

    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(
      apiKey,
    )}`;

    const body = {
      client: {
        clientId: 'sigbang',
        clientVersion: '1.0',
      },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        this.logger.warn(`Safe Browsing check failed status=${res.status}`);
        return [];
      }

      const json = (await res.json().catch(() => null)) as ThreatMatchesResponse | null;
      const matches = Array.isArray(json?.matches) ? json!.matches! : [];

      const types = Array.from(
        new Set(
          matches
            .map((m) => (m && typeof m === 'object' ? String(m.threatType ?? '') : ''))
            .filter((s) => !!s),
        ),
      );

      return types;
    } catch (e: any) {
      // timeout / network / parsing errors should not block normal link usage
      this.logger.warn(`Safe Browsing check error: ${String(e?.message || e)}`);
      return [];
    } finally {
      clearTimeout(timer);
    }
  }
}


