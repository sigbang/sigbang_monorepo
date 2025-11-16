import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtFastGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { headers: any }>();
    const auth = req.headers?.authorization || '';
    const token = typeof auth === 'string' && auth.startsWith('Bearer ')
      ? auth.slice('Bearer '.length)
      : undefined;
    if (!token) throw new UnauthorizedException('Missing Bearer token');
    try {
      await this.jwtService.verifyAsync(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}


