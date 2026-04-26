import { IsEmail, IsPhoneNumber, IsString, IsStrongPassword, IsUrl, IsOptional } from 'class-validator';

export class LoginUserDto{

    @IsEmail()
    email: string;

    @IsOptional()
    password?: string;
    
}