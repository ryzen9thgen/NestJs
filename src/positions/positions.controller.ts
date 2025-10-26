import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PositionsService } from './positions.service'; // ✅ FIX 1: Import the REAL service
import type { Request as ExpressRequest } from 'express';

@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: number) {
    await this.positionsService.delete(id);
    return {
      message: 'Position deleted successfully.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    const positions = await this.positionsService.findAll();
    return positions;
  }

@UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: ExpressRequest,
    @Body() body: { position_code: string; position_name: string },
  ) {
    const { position_code, position_name } = body;
    
    // ✅ THE FIX IS HERE:
    // Your strategy returns the full user object, so we get the 'id'.
    // ✅ CORRECT
    const userId = (req.user as any)?.userId; // Must match the strategy file

    // This check will now pass
    if (!userId) {
      throw new UnauthorizedException('Could not identify user from token');
    }

    return this.positionsService.createPositions(
      position_code,
      position_name,
      userId,
    );
  }

  // ✅ FIX 2: Corrected your update function
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() data: { position_code?: string; position_name?: string },
  ) {
    const updatedPosition = await this.positionsService.update(id, data);
    return {
      message: 'Position updated successfully',
      position: updatedPosition,
    };
  }
}