export class AccountDetailDto {
    id: number;
    name?: string;
    surname?: string;
    username: string;
    email?: string;
    phone_number?: string;
    pictureUrl?: string;
    city?: string;
    countryCode?: string;
    createdAt: Date;
    description?: string;
    rating: number;
    reviews: number;
}