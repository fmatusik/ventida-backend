# Ventida – backend

API marketplace'u ogłoszeniowego (NestJS 11 + Prisma + PostgreSQL). Frontend: repo `ventida-frontend`.

## Uruchomienie

```bash
npm install
cp .env.example .env        # uzupełnij DATABASE_URL i JWT_SECRET (openssl rand -hex 32)
npx prisma migrate deploy
npm run start:dev           # http://localhost:6969
```

Pierwszego administratora (może zarządzać kategoriami/atrybutami i moderować treści) ustawiasz po rejestracji konta:

```bash
npm run make-admin -- jan@example.com
```

## Bezpieczeństwo (skrót)

- `JWT_SECRET` jest wymagany (min. 32 znaki) – bez niego aplikacja się nie uruchomi. Użytkownik z tokenu jest ładowany z bazy przy każdym żądaniu.
- Hasła: bcrypt (12), polityka siły hasła, jednolity komunikat i czas odpowiedzi przy złym loginie/e-mailu.
- Każdy zasób ma sprawdzanie właściciela/uczestnika (ogłoszenia, zdjęcia, czaty, wiadomości, adresy, konta). Kategorie/atrybuty – tylko `ADMIN`.
- Odpowiedzi nigdy nie zawierają hasha hasła; e-mail i telefon widzi tylko właściciel konta.
- Upload: wymaga logowania, typ rozpoznawany po zawartości (JPG/PNG/GIF/WEBP), nazwa generowana na serwerze, limit 5 MB.
- `helmet`, CORS tylko dla `FRONTEND_URL`, rate limiting (globalnie 120/min/IP; logowanie 10/min, rejestracja 10/h, ogłoszenia 20/h, wiadomości 30/min). Za reverse proxy ustaw `TRUST_PROXY`.

## Testy

```bash
npm test                                   # unit
TEST_DATABASE_URL=postgresql://... npm run test:e2e   # e2e na OSOBNEJ bazie (po `prisma migrate deploy` na niej)
```
