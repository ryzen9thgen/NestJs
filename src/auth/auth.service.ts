import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // ✅ 1. IMPLEMENTED THIS FUNCTION
  // Your controller calls this, but it was empty.
  async generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email: email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET || 'access_secret',
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret',
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  // ✅ 2. FIXED THIS FUNCTION
  async refreshTokens(userId: number, refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret',
      });

      if (payload.sub !== userId) {
        throw new UnauthorizedException('Invalid user');
      }

      const user = await this.usersService.findUserById(payload.sub);
      if (!user || !user.hashedRefreshToken) {
        throw new UnauthorizedException('Access Denied');
      }

      // This part is correct: compares plain token to the hash in DB
      const isMatching = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );
      if (!isMatching) {
        throw new UnauthorizedException('Access Denied: Token mismatch');
      }

      // Generate new tokens
      const newTokens = await this.generateTokens(user.id, user.email);

      // ❗ THIS IS THE FIX:
      // You must save the NEW refresh token.
      // Your controller hashes it, so we'll hash it here too.
      await this.usersService.setRefreshToken(user.id, newTokens.refreshToken);

      return newTokens;
    } catch (e) {
      throw new UnauthorizedException('Could not refresh token');
    }
  }

  async logout(userId: number) {
    await this.usersService.removeRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }

  // ℹ️ NOTE: Your controller is not using the two functions below.
  // It is doing this logic itself, which is bad practice.
  // In the future, you should move your controller's login logic
  // into these service functions.

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    return { id: user.id, username: user.username, role: user.role };
  }

  async login(user: { id: number; username: string; role: string }) {
    const tokens = await this.generateTokens(user.id, user.username);
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }
}