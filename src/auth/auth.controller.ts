import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  ConflictException,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    refreshToken: string;
  };
}

@Injectable()
class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
class RefreshJwtGuard extends AuthGuard('refresh-jwt') {}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // ✅ REGISTER
  @Post('register')
  async register(@Body() body: any) {
    const { username, email, password, role, gender } = body;

    // 🔍 Check if email already exists
    const existingUser = await this.usersService.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🧑 Create user
    const newUser = await this.usersService.createUser(
      username,
      hashedPassword, // ✅ This MUST be 'hashedPassword'
      email,
      role || 'user',
      gender || 'unspecified',
    );

    return {
      message: 'User registered successfully!',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        gender: newUser.gender,
      },
    };
  }

  // ✅ LOGIN
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const { username, password } = body;

    // 🔍 Find user by username
    const user = await this.usersService.findUserByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // 🔐 Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // 🎟 Generate access + refresh tokens
    const tokens = await this.authService.generateTokens(user.id, user.email);

    // 💾 Store hashed refresh token in DB
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);

    return {
      message: 'Login successful!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ✅ REFRESH TOKEN
  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;

    const tokens = await this.authService.refreshTokens(userId, refreshToken);

    return {
      id: userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}