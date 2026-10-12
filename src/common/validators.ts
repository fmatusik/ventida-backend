import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

const UPLOAD_PATH = /^\/uploads\/[A-Za-z0-9._-]{1,100}$/;

/** Dozwolony jest tylko plik wgrany przez nasz endpoint /upload lub zewnętrzny adres https. */
export function IsImageUrl(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isImageUrl',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || value.length > 500) return false;
          if (UPLOAD_PATH.test(value)) return true;
          try {
            return new URL(value).protocol === 'https:';
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} musi być adresem https lub zdjęciem wgranym na serwer`;
        },
      },
    });
}

export const PHONE_REGEX = /^\+?[0-9 ()-]{7,20}$/;
export const USERNAME_REGEX = /^[A-Za-z0-9_.-]{3,30}$/;

import { Transform } from 'class-transformer';

/** "" -> undefined (pole opcjonalne pominięte) */
export const EmptyToUndefined = () =>
  Transform(({ value }) => (value === '' || value === null ? undefined : value));

/** "" -> null (czyszczenie pola w bazie) */
export const EmptyToNull = () =>
  Transform(({ value }) => (value === '' ? null : value));
