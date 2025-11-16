import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SigBang API - 요리 레시피 SNS 플랫폼 🍳👨‍🍳';
  }
} 