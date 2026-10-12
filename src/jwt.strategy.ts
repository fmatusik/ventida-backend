import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from './prisma/prisma.service';
import { AuthUser } from './common/roles';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  /** Użytkownik jest pobierany z bazy - usunięte konto lub zmieniona rola działa od razu. */
  async validate(payload: { sub: number }): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, email: true, role: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
