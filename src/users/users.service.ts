import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'mysql2/promise';

@Injectable()
export class UsersService {
  // 1. Remove 'private pool: Pool;'
  
  // 2. Fix the constructor to ONLY inject the service.
  constructor(private readonly db: DatabaseService) {}

  // 3. Helper function to get the pool (or just call this.db.getPool() directly)
  private getPool(): Pool {
    const pool = this.db.getPool();
    if (!pool) {
      throw new InternalServerErrorException('Database connection not initialized.');
    }
    return pool;
  }

  // ✅ Create new user
  async createUser(
    username: string,
    password: string, 
    email: string,
    role: string,
    gender: string,
  ) {
    // 4. Get the pool *inside the method*
    const pool = this.getPool(); 
    
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email],
    );

    if (rows.length > 0) {
      throw new ConflictException('Username or email already exists');
    }

    const [result]: any = await pool.query(
      'INSERT INTO users (username, password, email, role, gender) VALUES (?, ?, ?, ?, ?)',
      [username, password, email, role, gender], 
    );

    const [userRows]: any = await pool.query(
      'SELECT id, username, email, role, gender FROM users WHERE id = ?',
      [result.insertId],
    );

    return userRows[0];
  }

  // ✅ Find user by username
  async findUserByUsername(username: string) {
    const pool = this.getPool(); // Get pool inside the method
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // ✅ Find user by email
  async findUserByEmail(email: string) {
    const pool = this.getPool(); // Get pool inside the method
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findUserById(id: number) {
    const pool = this.getPool(); // Get pool inside the method
    const [rows]: any = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async findAll() {
    const pool = this.getPool(); // Get pool inside the method
    const [rows]: any = await pool.query(
      'SELECT id, username, email, role, gender FROM users',
    );
    return rows;
  }

  // ✅ Update user
  async updateUser(
    id: number,
    partial: {
      username?: string;
      password?: string;
      email?: string;
      role?: string;
      gender?: string;
    },
  ) {
    const pool = this.getPool(); // Get pool inside the method
    const existingUser = await this.findUserById(id);
    if (!existingUser) throw new NotFoundException('User not found');

    if (partial.username || partial.email) {
      const [existing]: any = await pool.query(
        'SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?',
        [partial.username, partial.email, id],
      );
      if (existing.length > 0)
        throw new ConflictException('Username or email is already taken');
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (partial.username) {
      updates.push('username = ?');
      values.push(partial.username);
    }
    if (partial.password) {
      updates.push('password = ?');
      values.push(await bcrypt.hash(partial.password, 10));
    }
    if (partial.email) {
      updates.push('email = ?');
      values.push(partial.email);
    }
    if (partial.role) {
      updates.push('role = ?');
      values.push(partial.role);
    }
    if (partial.gender) {
      updates.push('gender = ?');
      values.push(partial.gender);
    }

    if (updates.length === 0) return this.findUserById(id);

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await pool.query(query, values);

    return this.findUserById(id);
  }

  async deleteUser(id: number) {
    const pool = this.getPool(); // Get pool inside the method
    const [result]: any = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) throw new NotFoundException('User not found');
    return { message: 'User deleted' };
  }

  // ✅ Store refresh token securely
  async setRefreshToken(userId: number, refreshToken: string) {
    const pool = this.getPool(); // Get pool inside the method
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await pool.query(
      'UPDATE users SET hashedRefreshToken = ? WHERE id = ?',
      [hashedRefreshToken, userId],
    );
  }

  // ✅ Verify refresh token
  async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
    const pool = this.getPool(); // Get pool inside the method
    const user = await this.findUserById(userId);
    if (!user || !user.hashedRefreshToken)
      throw new ForbiddenException('Access Denied');

    const isMatching = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!isMatching) throw new ForbiddenException('Access Denied');

    return user;
  }

  // ✅ Logout (remove refresh token)
  async removeRefreshToken(userId: number) {
    const pool = this.getPool(); // Get pool inside the method
    await pool.query(
      'UPDATE users SET hashedRefreshToken = NULL WHERE id = ?',
      [userId],
    );
    return { message: 'Refresh token removed' };
  }
}