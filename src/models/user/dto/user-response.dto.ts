export class UserResponseDto {
  id: number;
  name: string;
  surname: string;
  username: string;
  email: string;
  phone_number?: string;
  pictureUrl?: string;
  googleId?: string;
  createdAt: Date;
  description?: string;
}
