import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.body?.refreshToken || req?.cookies?.refreshToken,
      ]),
      secretOrKey: process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req?.body?.refreshToken || req?.cookies?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

    const user = await this.usersService.findUserById(payload.sub);
    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException('Access Denied');

    const isMatching = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!isMatching) throw new UnauthorizedException('Invalid refresh token');

    return user; // attaches `req.user`
  }
}
