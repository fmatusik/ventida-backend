import { IsOptional, IsPhoneNumber, IsString } from "class-validator";


export class UpdateAddressDto{

    @IsString()
    name: string;

    @IsString()
    surname: string;

    @IsOptional()
    @IsPhoneNumber()
    phone_number?: string;

    @IsString()
    country: string;

    @IsString()
    town: string;

    @IsString()
    street: string;

    @IsString()
    building_number: string;

    @IsOptional()
    @IsString()
    apartment_number?: string;

    @IsString()
    zip: string;
    
}