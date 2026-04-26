import { ListingImageResponseDto } from "../../listing-image/dto/listing-image-response.dto";

export class ListingResponseDto {
  id: number;
  title: string;
  description: string;
  price: number;
  is_negotiable: boolean;
  status: string;
  location: string;
  created_at: Date;
  expires_at?: Date;
  contact_person?: string;
  email?: string;
  phone_number?: string;
  userId: number;
  categoryId: number;
  images?: ListingImageResponseDto[];
}
