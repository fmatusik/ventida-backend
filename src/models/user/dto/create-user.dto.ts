import { IsEmail, IsPhoneNumber, IsString, IsStrongPassword, IsUrl, IsOptional } from 'class-validator';

export class CreateUserDto{

    @IsEmail()
    email: string;

    @IsOptional()
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minSymbols: 1,
    })
    password?: string;

    @IsOptional()
    @IsUrl()
    pictureUrl?: string;

    @IsOptional()
    @IsString()
    googleId?: string;

}