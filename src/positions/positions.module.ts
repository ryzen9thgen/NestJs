import { Module } from '@nestjs/common';
import { PositionsController } from './positions.controller'; // Import controller
import { PositionsService } from './positions.service';    // ✅ FIX: Import service from its own file
import { DatabaseService } from '../database/database.service'; 

@Module({
  controllers: [PositionsController],
  providers: [
    PositionsService, 
    DatabaseService,  
  ],
})
export class PositionsModule {}