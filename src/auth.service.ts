import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginUserDto } from './models/user/dto/login-user.dto';
import { UserService } from './models/user/user.service';
import * as bcrypt from 'bcrypt' ;

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  async generateToken(user: { id: number; email: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async login(userToLogin: LoginUserDto) {
    const user = await this.userService.getByEmail(userToLogin.email)

    if(!user) {
        throw new UnauthorizedException("Nieprawidłowy email lub hasło")
    }

    const isPasswordValid = await bcrypt.compare(userToLogin.password, user.password);

    if(!isPasswordValid) throw new UnauthorizedException("Nieprawidłowy email lub hasło");
    
    const token = await this.generateToken({
        id: user.id,
        email: user.email,
    });

    return token;

  }
}
