import { Injectable, NotFoundException, Req } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class PositionsService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async findAll() {
    const [rows] = await this.pool().execute('SELECT * FROM positions');
    return rows;
  }
  async getAll() {
    return this.findAll();
  }

  async delete(position_id: number) {
    const [result] = await this.pool().execute<OkPacket>(
      'DELETE FROM positions WHERE position_id = ?',
      [position_id],
    );
    // You should add a check here
    if ((result as any).affectedRows === 0) {
      throw new NotFoundException(`Position with ID ${position_id} not found`);
    }
  }

  // ✅ FIX 1: Corrected the 'createPositions' function
  async createPositions(
    position_code: string,
    position_name: string,
    userId: number, // Renamed 'id' to 'userId' for clarity
  ) {
    const [result] = await this.pool().execute<OkPacket>(
      // Changed 'id' to 'user_id' to match your database
      'INSERT INTO positions (position_code, position_name, user_id) VALUES (?, ?, ?)',
      [position_code, position_name, userId ?? null],
    );
    return {
      position_id: (result as any).insertId,
      position_code,
      position_name,
      user_id: userId, // Changed this to match
    };
  }

  // ✅ FIX 2: Corrected the 'findById' function
  async findById(id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      // This was searching the 'users' table by mistake
      'SELECT * FROM positions WHERE position_id = ?',
      [id],
    );
    return rows[0];
  }

  async update(
    position_id: number,
    data: { position_code?: string; position_name?: string },
  ) {
    // This is a partial update, it's better to build the query dynamically
    // But for a simple fix, let's get the existing data first
    const existing = await this.findById(position_id);
    if (!existing) {
      throw new NotFoundException(`Position with ID ${position_id} not found`);
    }

    const position_code = data.position_code ?? existing.position_code;
    const position_name = data.position_name ?? existing.position_name;

    const [result]: any = await this.pool().execute(
      'UPDATE positions SET position_code = ?, position_name = ? WHERE position_id = ?',
      [position_code, position_name, position_id],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Position with ID ${position_id} not found`);
    }

    return { position_id, position_code, position_name };
  }
}