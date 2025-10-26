// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    ConfigModule, // Imports ConfigModule to make ConfigService available
  ],
  providers: [DatabaseService],
  exports: [DatabaseService], // Exports DatabaseService for other modules to use
})
export class DatabaseModule {} // ✅ This "export" keyword fixes your error