import request from 'supertest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, PNG_BYTES, TEST_DB } from './helpers';

process.env.DISABLE_THROTTLE = 'true';

const PASSWORD = 'Sup3rSecret!';
const describeIf = TEST_DB ? describe : describe.skip;

describeIf('Ventida API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let http: () => ReturnType<typeof request>;

  const run = Date.now();
  const users: Record<string, { id: number; email: string; token: string }> = {};
  let categoryId: number;
  let listingId: number;
  let chatId: number;
  const uploaded: string[] = [];

  const auth = (who: string) => ({ Authorization: `Bearer ${users[who].token}` });

  async function register(name: string, asAdmin = false) {
    const email = `e2e-${run}-${name}@example.com`;
    const reg = await http()
      .post('/user')
      .send({ email, password: PASSWORD, username: `${name}_${run}` })
      .expect(201);
    if (asAdmin) {
      await prisma.user.update({ where: { id: reg.body.userId }, data: { role: 'ADMIN' } });
    }
    const login = await http().post('/auth/login').send({ email, password: PASSWORD }).expect(200);
    users[name] = { id: reg.body.userId, email, token: login.body.accessToken };
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    http = () => request(app.getHttpServer());

    await register('alice');
    await register('bob');
    await register('mallory');
    await register('root', true);

    const cat = await prisma.category.create({
      data: { name: 'E2E', slug: `e2e-${run}` },
    });
    categoryId = cat.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: `e2e-${run}-` } } });
    await prisma.category.deleteMany({ where: { slug: { startsWith: `e2e-${run}` } } });
    await Promise.all(uploaded.map((f) => fs.rm(join(process.cwd(), 'uploads', f), { force: true })));
    await app.close();
  });

  describe('rejestracja i logowanie', () => {
    it('odrzuca słabe hasło', () =>
      http().post('/user').send({ email: `e2e-${run}-weak@example.com`, password: 'abc' }).expect(400));

    it('odrzuca nieznane pola (np. próbę nadania roli)', () =>
      http()
        .post('/user')
        .send({ email: `e2e-${run}-x@example.com`, password: PASSWORD, role: 'ADMIN' })
        .expect(400));

    it('odrzuca zduplikowany e-mail (409), także w innej wielkości liter', () =>
      http()
        .post('/user')
        .send({ email: users.alice.email.toUpperCase(), password: PASSWORD })
        .expect(409));

    it('logowanie ze złym hasłem i nieznanym e-mailem daje identyczny komunikat', async () => {
      const bad = await http().post('/auth/login').send({ email: users.alice.email, password: 'Nope1234!' }).expect(401);
      const unknown = await http().post('/auth/login').send({ email: 'nobody@example.com', password: 'Nope1234!' }).expect(401);
      expect(bad.body.message).toBe(unknown.body.message);
    });

    it('/user/me zwraca profil bez hasła i googleId', async () => {
      const res = await http().get('/user/me').set(auth('alice')).expect(200);
      expect(res.body.email).toBe(users.alice.email);
      expect(res.body.role).toBe('USER');
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('googleId');
    });

    it('endpointy chronione wymagają tokenu', async () => {
      await http().get('/user/me').expect(401);
      await http().get('/chat').expect(401);
      await http().post('/listing').send({}).expect(401);
      await http().post('/upload').expect(401);
      await http().get('/user/me').set('Authorization', 'Bearer garbage').expect(401);
    });

    it('token usuniętego użytkownika przestaje działać', async () => {
      await register('ghost');
      await prisma.user.delete({ where: { id: users.ghost.id } });
      await http().get('/user/me').set(auth('ghost')).expect(401);
    });
  });

  describe('konta użytkowników', () => {
    it('publiczny profil nie ujawnia e-maila ani telefonu, własny - tak', async () => {
      await http().put(`/user/${users.alice.id}`).set(auth('alice')).send({ phone_number: '+48 123 456 789', city: 'Kraków' }).expect(200);
      const pub = await http().get(`/user/${users.alice.id}`).expect(200);
      expect(pub.body.email).toBeUndefined();
      expect(pub.body.phone_number).toBeUndefined();
      expect(pub.body.city).toBe('Kraków');
      const own = await http().get(`/user/${users.alice.id}`).set(auth('alice')).expect(200);
      expect(own.body.email).toBe(users.alice.email);
    });

    it('nie można edytować ani usuwać cudzego konta', async () => {
      await http().put(`/user/${users.alice.id}`).set(auth('mallory')).send({ description: 'hacked' }).expect(403);
      await http().delete(`/user/${users.alice.id}`).set(auth('mallory')).expect(403);
      await http().put(`/user/${users.alice.id}/password`).set(auth('mallory')).send({ oldPassword: PASSWORD, newPassword: 'Evil1234!' }).expect(403);
    });

    it('nie da się nadać sobie roli ani zmienić e-maila przez update', async () => {
      await http().put(`/user/${users.mallory.id}`).set(auth('mallory')).send({ role: 'ADMIN' }).expect(400);
      await http().put(`/user/${users.mallory.id}`).set(auth('mallory')).send({ email: 'x@example.com' }).expect(400);
    });

    it('wyszukiwarka nie szuka po e-mailu', async () => {
      const res = await http().get('/user/search').query({ q: `e2e-${run}` }).expect(200);
      expect(res.body).toEqual([]);
      const byName = await http().get('/user/search').query({ q: `alice_${run}` }).expect(200);
      expect(byName.body.length).toBe(1);
      expect(JSON.stringify(byName.body)).not.toContain('@example.com');
    });

    it('zmiana hasła wymaga starego hasła i silnego nowego', async () => {
      await http().put(`/user/${users.bob.id}/password`).set(auth('bob')).send({ oldPassword: 'wrong', newPassword: 'NewPass123!' }).expect(400);
      await http().put(`/user/${users.bob.id}/password`).set(auth('bob')).send({ oldPassword: PASSWORD, newPassword: 'weak' }).expect(400);
      await http().put(`/user/${users.bob.id}/password`).set(auth('bob')).send({ oldPassword: PASSWORD, newPassword: 'NewPass123!' }).expect(200);
      await http().post('/auth/login').send({ email: users.bob.email, password: 'NewPass123!' }).expect(200);
      await http().post('/auth/login').send({ email: users.bob.email, password: PASSWORD }).expect(401);
    });
  });

  describe('kategorie', () => {
    it('zwykły użytkownik nie może tworzyć ani usuwać kategorii', async () => {
      await http().post('/category').set(auth('mallory')).send({ name: 'Spam', slug: `e2e-${run}-spam` }).expect(403);
      await http().delete(`/category/${categoryId}`).set(auth('mallory')).expect(403);
      await http().post('/category').send({ name: 'Spam', slug: `e2e-${run}-spam` }).expect(401);
    });

    it('admin może tworzyć kategorie', async () => {
      const res = await http().post('/category').set(auth('root')).send({ name: 'Child', slug: `e2e-${run}-child`, parent_id: categoryId }).expect(201);
      expect(res.body.data.parent_id).toBe(categoryId);
    });

    it('nie pozwala utworzyć cyklu w drzewie kategorii', async () => {
      const child = await prisma.category.findUniqueOrThrow({ where: { slug: `e2e-${run}-child` } });
      await http().put(`/category/${categoryId}`).set(auth('root')).send({ parent_id: child.id }).expect(400);
    });
  });

  describe('ogłoszenia', () => {
    const listing = () => ({
      title: 'Rower górski',
      description: 'Sprawny rower, mało używany, odbiór osobisty.',
      price: 999.99,
      location: 'Warszawa',
      categoryId,
    });

    it('tworzy ogłoszenie dla zalogowanego (pola puste jako opcjonalne)', async () => {
      const res = await http()
        .post('/listing')
        .set(auth('alice'))
        .send({ ...listing(), email: '', phone_number: '', contact_person: '', images: [{ url: '/uploads/abc.png', position: 0 }] })
        .expect(201);
      listingId = res.body.data.id;
      expect(res.body.data.userId).toBe(users.alice.id);
      expect(res.body.data.status).toBe('available');
    });

    it('waliduje dane wejściowe', async () => {
      await http().post('/listing').set(auth('alice')).send({ ...listing(), price: -1 }).expect(400);
      await http().post('/listing').set(auth('alice')).send({ ...listing(), title: 'ab' }).expect(400);
      await http().post('/listing').set(auth('alice')).send({ ...listing(), status: 'hacked' }).expect(400);
      await http().post('/listing').set(auth('alice')).send({ ...listing(), categoryId: 99999999 }).expect(400);
      await http().post('/listing').set(auth('alice')).send({ ...listing(), userId: users.bob.id }).expect(400);
      await http().post('/listing').set(auth('alice')).send({ ...listing(), images: [{ url: 'javascript:alert(1)', position: 0 }] }).expect(400);
      await http().post('/listing').set(auth('alice')).send({ ...listing(), images: [{ url: 'http://evil.example/x.png', position: 0 }] }).expect(400);
    });

    it('szczegóły ogłoszenia nie ujawniają hasła ani e-maila sprzedawcy', async () => {
      const res = await http().get(`/listing/${listingId}`).expect(200);
      const body = JSON.stringify(res.body);
      expect(body).not.toContain('password');
      expect(body).not.toContain('$2b$');
      expect(body).not.toContain('@example.com');
      expect(res.body.data.user.username).toBe(`alice_${run}`);
    });

    it('lista ma twardy limit take i odporna na śmieciowe parametry', async () => {
      const res = await http().get('/listing').query({ take: 100000, skip: 'abc', minPrice: 'x' }).expect(200);
      expect(res.body.count).toBeLessThanOrEqual(50);
      await http().get('/listing/abc').expect(400);
    });

    it('obcy użytkownik nie edytuje, nie usuwa ani nie dodaje zdjęć', async () => {
      await http().put(`/listing/${listingId}`).set(auth('mallory')).send({ title: 'Hacked title' }).expect(403);
      await http().delete(`/listing/${listingId}`).set(auth('mallory')).expect(403);
      await http().post(`/listing/${listingId}/image`).set(auth('mallory')).send({ url: '/uploads/x.png', position: 1 }).expect(403);
      const imgs = (await http().get(`/listing/${listingId}`)).body.data.images;
      await http().delete(`/listing/${listingId}/image/${imgs[0].id}`).set(auth('mallory')).expect(403);
    });

    it('właściciel edytuje ogłoszenie i zdjęcia', async () => {
      const res = await http().put(`/listing/${listingId}`).set(auth('alice')).send({ price: 899 }).expect(200);
      expect(res.body.data.price).toBe(899);
      await http().post(`/listing/${listingId}/image`).set(auth('alice')).send({ url: '/uploads/second.png', position: 1 }).expect(201);
    });

    it('wyświetlenia: własne nie są liczone, cudze tak, lista widzów tylko dla właściciela', async () => {
      const own = await http().post('/view').set(auth('alice')).send({ listingId }).expect(201);
      expect(own.body.data.counted).toBe(false);
      const first = await http().post('/view').set(auth('bob')).send({ listingId }).expect(201);
      const again = await http().post('/view').set(auth('bob')).send({ listingId }).expect(201);
      expect(first.body.data.counted).toBe(true);
      expect(again.body.data.counted).toBe(false);
      await http().post('/view').send({ listingId }).expect(201); // anonimowo
      await http().get(`/view/listing/${listingId}`).set(auth('mallory')).expect(403);
      const viewers = await http().get(`/view/listing/${listingId}`).set(auth('alice')).expect(200);
      expect(JSON.stringify(viewers.body)).not.toContain('@example.com');
      const count = await http().get(`/view/listing/${listingId}/count`).expect(200);
      expect(count.body.data.count).toBe(2);
    });

    it('ulubione: toggle działa dwukierunkowo', async () => {
      const a = await http().post(`/favourite/${listingId}/toggle`).set(auth('bob')).expect(201);
      expect(a.body.action).toBe('added');
      const b = await http().post(`/favourite/${listingId}/toggle`).set(auth('bob')).expect(201);
      expect(b.body.action).toBe('deleted');
    });
  });

  describe('czaty i wiadomości', () => {
    it('właściciel nie może pisać sam do siebie', () =>
      http().post('/chat').set(auth('alice')).send({ listingId }).expect(400));

    it('kupujący tworzy czat (idempotentnie)', async () => {
      const a = await http().post('/chat').set(auth('bob')).send({ listingId }).expect(201);
      const b = await http().post('/chat').set(auth('bob')).send({ listingId }).expect(201);
      expect(a.body.data.id).toBe(b.body.data.id);
      chatId = a.body.data.id;
      const body = JSON.stringify(a.body);
      expect(body).not.toContain('password');
      expect(body).not.toContain('@example.com');
    });

    it('obie strony widzą czat, postronny nie', async () => {
      await http().get(`/chat/${chatId}`).set(auth('bob')).expect(200);
      await http().get(`/chat/${chatId}`).set(auth('alice')).expect(200);
      await http().get(`/chat/${chatId}`).set(auth('mallory')).expect(404);
      await http().get(`/chat/${chatId}`).expect(401);
      const mine = await http().get('/chat').set(auth('mallory')).expect(200);
      expect(mine.body.count).toBe(0);
    });

    it('lista czatów ogłoszenia tylko dla właściciela', async () => {
      await http().get(`/chat/listing/${listingId}`).set(auth('mallory')).expect(403);
      await http().get(`/chat/listing/${listingId}`).set(auth('bob')).expect(403);
      const res = await http().get(`/chat/listing/${listingId}`).set(auth('alice')).expect(200);
      expect(res.body.count).toBe(1);
    });

    it('wiadomości: tylko uczestnicy, walidacja treści', async () => {
      await http().post('/message').set(auth('mallory')).send({ chatId, message: 'wtrącam się' }).expect(404);
      await http().post('/message').set(auth('bob')).send({ chatId, message: '   ' }).expect(400);
      await http().post('/message').set(auth('bob')).send({ chatId, message: 'x'.repeat(2001) }).expect(400);
      const sent = await http().post('/message').set(auth('bob')).send({ chatId, message: ' Dzień dobry ' }).expect(201);
      expect(sent.body.data.message).toBe('Dzień dobry');
      expect(sent.body.data.senderId).toBe(users.bob.id);
      await http().get(`/message/chat/${chatId}`).set(auth('mallory')).expect(404);
      const msgs = await http().get(`/message/chat/${chatId}`).set(auth('alice')).expect(200);
      expect(msgs.body.count).toBe(1);
    });

    it('edycja/usuwanie tylko przez autora, "przeczytane" tylko przez odbiorcę', async () => {
      const msg = await prisma.message.findFirstOrThrow({ where: { chatId } });
      await http().put(`/message/${msg.id}`).set(auth('alice')).send({ message: 'podmiana' }).expect(403);
      await http().delete(`/message/${msg.id}`).set(auth('alice')).expect(403);
      await http().put(`/message/${msg.id}`).set(auth('mallory')).send({ message: 'podmiana' }).expect(404);
      await http().put(`/message/${msg.id}`).set(auth('bob')).send({ is_read: true }).expect(400);

      // nadawca nie oznaczy własnej wiadomości jako przeczytanej
      await http().post(`/message/${msg.id}/read`).set(auth('bob')).expect(201);
      expect((await prisma.message.findUniqueOrThrow({ where: { id: msg.id } })).is_read).toBe(false);
      const unread = await http().get(`/message/chat/${chatId}/unread`).set(auth('alice')).expect(200);
      expect(unread.body.data.unreadCount).toBe(1);
      await http().post(`/message/${msg.id}/read`).set(auth('alice')).expect(201);
      expect((await prisma.message.findUniqueOrThrow({ where: { id: msg.id } })).is_read).toBe(true);
    });

    it('usunięcie ogłoszenia kasuje czaty i wiadomości (kaskada)', async () => {
      const extra = await http().post('/listing').set(auth('alice')).send({
        title: 'Do usunięcia', description: 'Ogłoszenie testowe do skasowania.', price: 1, location: 'Łódź', categoryId,
      }).expect(201);
      const id = extra.body.data.id;
      const chat = await http().post('/chat').set(auth('bob')).send({ listingId: id }).expect(201);
      await http().post('/message').set(auth('bob')).send({ chatId: chat.body.data.id, message: 'hej' }).expect(201);
      await http().delete(`/listing/${id}`).set(auth('alice')).expect(200);
      expect(await prisma.chat.count({ where: { listingId: id } })).toBe(0);
    });
  });

  describe('opinie i adresy', () => {
    it('opinie: nie samemu sobie, jedna na użytkownika, bez wycieku danych', async () => {
      await http().post('/review').set(auth('alice')).send({ reviewed_user_id: users.alice.id, rating: 5 }).expect(400);
      await http().post('/review').set(auth('bob')).send({ reviewed_user_id: users.alice.id, rating: 6 }).expect(400);
      const ok = await http().post('/review').set(auth('bob')).send({ reviewed_user_id: users.alice.id, rating: 5, comment: 'Polecam' }).expect(201);
      await http().post('/review').set(auth('bob')).send({ reviewed_user_id: users.alice.id, rating: 1 }).expect(400);
      const body = JSON.stringify(ok.body) + JSON.stringify((await http().get(`/review/reviewer/${users.bob.id}`)).body);
      expect(body).not.toContain('password');
      expect(body).not.toContain('@example.com');
      await http().put(`/review/${ok.body.data.id}`).set(auth('mallory')).send({ rating: 1 }).expect(403);
      await http().delete(`/review/${ok.body.data.id}`).set(auth('mallory')).expect(403);
    });

    it('adresy są prywatne', async () => {
      const addr = await http().post('/address').set(auth('alice')).send({
        name: 'Anna', surname: 'Nowak', country: 'PL', town: 'Gdańsk', street: 'Długa', building_number: '1', zip: '80-001',
      }).expect(201);
      const id = addr.body.data.id;
      await http().get(`/address/${id}`).expect(401);
      await http().get(`/address/${id}`).set(auth('mallory')).expect(404);
      await http().put(`/address/${id}`).set(auth('mallory')).send({ town: 'X' }).expect(403);
      await http().delete(`/address/${id}`).set(auth('mallory')).expect(403);
      await http().get(`/address/${id}`).set(auth('alice')).expect(200);
    });
  });

  describe('upload', () => {
    it('przyjmuje prawdziwy obraz i serwuje go z nagłówkami bezpieczeństwa', async () => {
      const res = await http().post('/upload').set(auth('alice')).attach('file', PNG_BYTES, 'zdjecie.PNG').expect(201);
      expect(res.body.url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);
      uploaded.push(res.body.url.replace('/uploads/', ''));
      const file = await http().get(res.body.url).expect(200);
      expect(file.headers['x-content-type-options']).toBe('nosniff');
      expect(file.headers['content-type']).toContain('image/png');
    });

    it('odrzuca plik, który tylko udaje obraz, oraz SVG/HTML', async () => {
      await http().post('/upload').set(auth('alice')).attach('file', Buffer.from('<script>alert(1)</script>'.repeat(5)), 'x.png').expect(400);
      await http().post('/upload').set(auth('alice')).attach('file', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 'x.svg').expect(400);
      await http().post('/upload').set(auth('alice')).attach('file', Buffer.from('<html></html>'), 'x.html').expect(400);
    });

    it('odrzuca za duży plik i brak pliku', async () => {
      const big = Buffer.concat([PNG_BYTES, Buffer.alloc(5 * 1024 * 1024)]);
      await http().post('/upload').set(auth('alice')).attach('file', big, 'big.png').expect(413);
      await http().post('/upload').set(auth('alice')).expect(400);
    });
  });

  describe('nagłówki i CORS', () => {
    it('ustawia nagłówki bezpieczeństwa i nie zdradza frameworka', async () => {
      const res = await http().get('/health').expect(200);
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['strict-transport-security']).toBeDefined();
    });

    it('CORS tylko dla zaufanej domeny frontendu', async () => {
      const good = await http().options('/listing').set('Origin', 'http://localhost:3000').set('Access-Control-Request-Method', 'GET');
      expect(good.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      const bad = await http().options('/listing').set('Origin', 'https://evil.example').set('Access-Control-Request-Method', 'GET');
      expect(bad.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
