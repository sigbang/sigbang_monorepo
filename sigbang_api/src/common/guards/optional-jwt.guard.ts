import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // JWT 토큰이 없어도 에러를 발생시키지 않음
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 에러가 있거나 사용자가 없어도 null을 반환하여 계속 진행
    if (err || !user) {
      return null;
    }
    return user;
  }
}