import { AccountDetailDto } from './dto/account-details.dto';

type MappableUser = {
  id: number;
  name?: string | null;
  surname?: string | null;
  username?: string | null;
  email?: string | null;
  phone_number?: string | null;
  pictureUrl?: string | null;
  city?: string | null;
  countryCode?: string | null;
  createdAt: Date;
  description?: string | null;
  _count: { reviewsTaken: number };
};

export class UserMapper {
  /**
   * @param includePrivate e-mail i telefon trafiają do odpowiedzi tylko dla właściciela konta / admina.
   */
  static toAccountDetails(
    user: MappableUser,
    avgRating: number,
    includePrivate = false,
  ): AccountDetailDto {
    return {
      id: user.id,
      name: user.name ?? undefined,
      surname: user.surname ?? undefined,
      username: user.username ?? '',
      email: includePrivate ? (user.email ?? undefined) : undefined,
      phone_number: includePrivate ? (user.phone_number ?? undefined) : undefined,
      pictureUrl: user.pictureUrl ?? undefined,
      city: user.city ?? undefined,
      countryCode: user.countryCode ?? undefined,
      createdAt: user.createdAt,
      description: user.description ?? undefined,
      reviews: user._count.reviewsTaken,
      rating: avgRating,
    };
  }
}
