import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('📊 Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('📊 Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    const modelNames = Reflect.ownKeys(this).filter(
      (key) => key[0] !== '_',
    );

    return Promise.all(
      modelNames.map((modelName) => (this as any)[modelName].deleteMany()),
    );
  }
} 