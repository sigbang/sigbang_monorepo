import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private serviceClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    // 일반 클라이언트 (사용자 인증용)
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 서비스 클라이언트 (관리자 권한용)
    this.serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getServiceClient(): SupabaseClient {
    return this.serviceClient;
  }

  // JWT 토큰 검증
  async verifyToken(token: string) {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      if (error) throw error;
      return data.user;
    } catch (error) {
      return null;
    }
  }

  // 파일 업로드 (Storage)
  async uploadFile(bucketName: string, path: string, file: Buffer, contentType?: string) {
    const { data, error } = await this.serviceClient.storage
      .from(bucketName)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) throw error;
    return data;
  }

  // 파일 삭제
  async deleteFile(bucketName: string, paths: string[]) {
    const { data, error } = await this.serviceClient.storage
      .from(bucketName)
      .remove(paths);

    if (error) throw error;
    return data;
  }

  // 파일 이동 (Storage)
  async moveFile(bucketName: string, fromPath: string, toPath: string) {
    const { data, error } = await this.serviceClient.storage
      .from(bucketName)
      .move(fromPath, toPath);

    if (error) throw error;
    return data;
  }

  // 파일 URL 가져오기
  getPublicUrl(bucketName: string, path: string) {
    const { data } = this.serviceClient.storage
      .from(bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // 서명된 다운로드 URL 생성 (Private 버킷용)
  async createSignedUrl(bucketName: string, path: string, expiresInSeconds = 300) {
    const { data, error } = await this.serviceClient.storage
      .from(bucketName)
      .createSignedUrl(path, expiresInSeconds);

    if (error) throw error;
    return data.signedUrl;
  }
} 