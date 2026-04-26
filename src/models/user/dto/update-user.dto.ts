import { IsEmail, IsPhoneNumber, IsString, IsStrongPassword, IsUrl, IsOptional } from 'class-validator';

export class CreateUserDto{

    @IsString()
    name: string;

    @IsString()
    surname: string;

    @IsString()
    username: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsPhoneNumber()
    phone_number?: string;

    @IsOptional()
    @IsUrl()
    pictureUrl?: string;

}