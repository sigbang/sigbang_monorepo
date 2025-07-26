import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' }, // Access Token 만료시간
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    TokenService,
    JwtStrategy,
    JwtAuthGuard, 
    RolesGuard,
  ],
  exports: [
    AuthService, 
    TokenService,
    JwtAuthGuard, 
    RolesGuard,
  ],
})
export class AuthModule {} 