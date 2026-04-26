import { User } from "@prisma/client";
import { AccountDetailDto } from "./dto/account-details.dto";

export class UserMapper {
  static toAccountDetails(
    user: User & { _count: { reviewsTaken: number } },
    avgRating: number
  ): AccountDetailDto {
    return {
      id: user.id,
      name: user.name ?? undefined,
      surname: user.surname ?? undefined,
      username: user.username ?? '', 
      email: user.email ?? undefined,
      phone_number: user.phone_number ?? undefined,
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