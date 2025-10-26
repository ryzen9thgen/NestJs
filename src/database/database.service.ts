// src/database/database.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Make sure ConfigService is imported
import * as mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: mysql.Pool | undefined;
  // Inject ConfigService again
  constructor(private configService: ConfigService) {} 

  async onModuleInit() {
    // Retrieve values ONLY from ConfigService
    const host = this.configService.get<string>('DB_HOST');
    const port = this.configService.get<number>('DB_PORT'); // Get as number
    const user = this.configService.get<string>('DB_USER');
    const password = this.configService.get<string>('DB_PASSWORD'); // Get password
    const database = this.configService.get<string>('DB_NAME');

    // Check if essential variables are loaded
    if (!host || !port || !user || !password || !database) {
        console.error('❌ Missing database configuration in environment variables!');
        throw new Error('Database configuration error');
    }

    this.pool = mysql.createPool({
      host: host,
      port: port, // Use the retrieved port
      user: user,
      password: password, // 
      database: database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    try {
        await this.pool.query('SELECT 1');
        console.log('✅ Database connection successful');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    }
  }

   async onModuleDestroy() {
     if (this.pool) {
        await this.pool.end();
        console.log('❌ MySQL pool closed');
     }
   }

   getPool() {
     if (!this.pool) {
        throw new Error('Database pool not initialized');
     }
     return this.pool;
   }
}