// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // 1. Import ConfigModule
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { PositionsModule } from './positions/positions.module';

@Module({
  imports: [
    // 2. Load the .env file and make ConfigService global
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Your other modules
    DatabaseModule,
    UsersModule,
    AuthModule,
    PositionsModule,
  ],
  controllers: [], // 3. Leave this empty
  providers: [],   // 4. Leave this empty
})
export class AppModule {}