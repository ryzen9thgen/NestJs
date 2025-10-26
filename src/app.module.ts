import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { PositionsModule } from './positions/positions.module'; // ✅ NEW FIX: Added 's'

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, PositionsModule],
})
export class AppModule {}