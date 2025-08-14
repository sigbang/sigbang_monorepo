import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * temp/{userId}/{sessionTs}/{uuid}.jpg 같은 경로를 만들어 presign URL 발급
   */
  async createUploadUrl(
    userId: string,
    dto: { contentType: string; kind?: 'thumbnail' | 'step' },
  ) {
    const bucketName =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipe-images';
    const session = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // yyyymmdd
    const ext = this.extFromContentType(dto.contentType);
    const key = `temp/${userId}/${session}/${randomUUID()}${ext}`;

    const serviceClient = this.supabaseService.getServiceClient();
    const signed = await serviceClient.storage
      .from(bucketName)
      .createSignedUploadUrl(key, { upsert: false });

    if (signed.error) {
      throw signed.error;
    }

    const { signedUrl, token } = signed.data;

    return {
      uploadUrl: signedUrl,
      path: key,
      contentType: dto.contentType,
      token,
    };
  }

  private extFromContentType(ct: string) {
    if (ct === 'image/png') return '.png';
    if (ct === 'image/webp') return '.webp';
    return '.jpg';
  }

  async getSignedDownloadUrl(path: string, expiresInSec = 300) {
    const bucketName =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipe-images';
    return this.supabaseService.createSignedUrl(bucketName, path, expiresInSec);
  }
}


