import { Prisma } from '@prisma/client';

/** Pola użytkownika, które można pokazać każdemu (bez e-maila, telefonu, hasła). */
export const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  name: true,
  surname: true,
  pictureUrl: true,
  city: true,
  countryCode: true,
  description: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/** Pola widoczne dla właściciela konta - nigdy hasło ani googleId. */
export const SELF_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  email: true,
  phone_number: true,
  role: true,
} satisfies Prisma.UserSelect;
