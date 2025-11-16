import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // 관리자 권한 체크 (예: 특정 이메일 도메인이나 별도 관리자 테이블)
    const isAdmin = this.checkAdminRole(user);
    const userRole: Role = isAdmin ? 'admin' : 'user';

    return requiredRoles.some((role) => role === userRole);
  }

  private checkAdminRole(user: any): boolean {
    // 여기서 관리자 권한을 체크하는 로직을 구현
    // 예: 특정 이메일 도메인, 별도 관리자 테이블 확인 등
    // 현재는 임시로 이메일 기반으로 체크
    const adminEmails = ['admin@sigbang.com', 'support@sigbang.com'];
    return adminEmails.includes(user?.email);
  }
} 