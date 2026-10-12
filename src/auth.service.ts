import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginUserDto } from './models/user/dto/login-user.dto';
import { UserService } from './models/user/user.service';
import * as bcrypt from 'bcrypt';

// Hash użyty, gdy użytkownik nie istnieje - czas odpowiedzi nie zdradza, czy e-mail jest w bazie.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async generateToken(user: { id: number; email: string }) {
    const payload = { sub: user.id, email: user.email };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async login(userToLogin: LoginUserDto) {
    const user = await this.userService.getByEmailWithPassword(userToLogin.email);

    const isPasswordValid = await bcrypt.compare(
      userToLogin.password,
      user?.password ?? DUMMY_HASH,
    );

    if (!user || !user.password || !isPasswordValid) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło');
    }

    return this.generateToken({ id: user.id, email: user.email });
  }
}
