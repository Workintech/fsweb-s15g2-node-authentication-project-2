const request = require('supertest')
const server = require('./api/server')
const db = require('./data/db-config')
const bcrypt = require('bcryptjs')
const jwtDecode = require('jwt-decode')

beforeAll(async () => {
  await db.migrate.rollback()
  await db.migrate.latest()
})
beforeEach(async () => {
  await db.seed.run()
})
afterAll(async () => {
  await db.destroy()
})

it('[0] sağlık', () => {
  expect(true).not.toBe(false)
})

describe('server.js', () => {
  describe('[POST] /api/auth/login', () => {
    it('[1] geçerli kriterlerde doğru mesajı döndürüyor', async () => {
      const res = await request(server).post('/api/auth/login').send({ username: 'bob', password: '1234' })
      expect(res.body.message).toMatch(/bob geri/i)
    }, 750)
    it('[2] kriterler geçersizse doğru mesaj ve durum kodu', async () => {
      let res = await request(server).post('/api/auth/login').send({ username: 'bobsy', password: '1234' })
      expect(res.body.message).toMatch(/ersiz kriter/i)
      expect(res.status).toBe(401)
      res = await request(server).post('/api/auth/login').send({ username: 'bob', password: '12345' })
      expect(res.body.message).toMatch(/ersiz kriter/i)
      expect(res.status).toBe(401)
    }, 750)
    it('[3] doğru token ve { subject, username, role_name, exp, iat } ile yanıtlıyor', async () => {
      let res = await request(server).post('/api/auth/login').send({ username: 'bob', password: '1234' })
      let decoded = jwtDecode(res.body.token)
      expect(decoded).toHaveProperty('iat')
      expect(decoded).toHaveProperty('exp')
      expect(decoded).toMatchObject({
        subject: 1,
        role_name: 'admin',
        username: 'bob',
      })
      res = await request(server).post('/api/auth/login').send({ username: 'sue', password: '1234' })
      decoded = jwtDecode(res.body.token)
      expect(decoded).toHaveProperty('iat')
      expect(decoded).toHaveProperty('exp')
      expect(decoded).toMatchObject({
        subject: 2,
        role_name: 'instructor',
        username: 'sue',
      })
    }, 750)
  })
  describe('[POST] /api/auth/register', () => {
    it('[4] istemci role_name sağlamadığında veritabanına yeni kullanıcı kaydı', async () => {
      await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234' })
      const devon = await db('users').where('username', 'devon').first()
      expect(devon).toMatchObject({ username: 'devon' })
    }, 750)
    it('[5] istemci role_name sağlamadığında role_id 3 olan (default) bir kullanıcı oluşturuluyor', async () => {
      await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234' })
      const devon = await db('users').where('username', 'devon').first()
      expect(devon).toMatchObject({ role_id: 2 })
    }, 750)
    it('[6] ismteci role_name instructor seçmişse role_id 2 olan bir kullanıcı oluşturuluyor', async () => {
      await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234', role_name: 'instructor' })
      const devon = await db('users').where('username', 'devon').first()
      expect(devon).toMatchObject({ role_id: 3 })
    }, 750)
    it('[7] role_name kayıtlı değilse yeni bir role_id li bir rol ve kullanıcı oluşturuluyor', async () => {
      await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234', role_name: 'valid' })
      const devon = await db('users').where('username', 'devon').first()
      expect(devon).toMatchObject({ role_id: 4 })
    }, 750)
    it('[8] şifre düz metin yerine kriptolu bir şekilde kaydediliyor', async () => {
      await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234' })
      const devon = await db('users').where('username', 'devon').first()
      expect(bcrypt.compareSync('1234', devon.password)).toBeTruthy()
    }, 750)
    it('[9] doğru kullanıcı yanıtlanıyor (istekten role_name çıkarıldığında)', async () => {
      const res = await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234' })
      expect(res.body).toMatchObject({ user_id: 3, username: 'devon', role_name: 'student' })
    }, 750)
    it('[10] doğru kullanıcı yanılanıyor (var olan bir role_name seçilirse)', async () => {
      const res = await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234', role_name: 'instructor' })
      expect(res.body).toMatchObject({ user_id: 3, username: 'devon', role_name: 'instructor' })
    }, 750)
    it('[11] doğru kullanıcı yanıtlanıyor (dc de geçerli bir role_name se)', async () => {
      const res = await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234', role_name: 'angel' })
      expect(res.body).toMatchObject({ user_id: 3, username: 'devon', role_name: 'angel' })
    }, 750)
    it('[12] baştaki ve sondaki boşluklar role_id den kırpıldı', async () => {
      const res = await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234', role_name: '    angel    ' })
      expect(res.body).toMatchObject({ user_id: 3, username: 'devon', role_name: 'angel' })
    }, 750)
    it('[13] role_id doğrulanmadan trimlendi', async () => {
      const res = await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234', role_name: '              angel              ' })
      expect(res.body).toMatchObject({ user_id: 3, username: 'devon', role_name: 'angel' })
    }, 750)
    it('[14] role_name trimden sonra 32 karakterden fazlaysa', async () => {
      const res = await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234', role_name: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' })
      expect(res.body.message).toMatch(/32 karakterden fazla/i)
      expect(res.status).toBe(422)
    }, 750)
    it('[15] istemci admin olarak kaydolmaya çalışırsa doğru mesaj ve durum', async () => {
      let res = await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234', role_name: 'admin' })
      expect(res.body.message).toMatch(/admin olamaz/i)
      expect(res.status).toBe(422)
      res = await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234', role_name: '    admin     ' })
      expect(res.body.message).toMatch(/admin olamaz/i)
      expect(res.status).toBe(422)
    }, 750)
    it('[16] başarılıysa doğru mesaj', async () => {
      const res = await request(server).post('/api/auth/register').send({ username: 'devon', password: '1234' })
      expect(res.status).toBe(201)
    }, 750)
  })
  describe('[GET] /api/users', () => {
    it('[17] token göndermeden denenrse doğru mesaj', async () => {
      const res = await request(server).get('/api/users')
      expect(res.body.message).toMatch(/token gereklidir/i)
    }, 750)
    it('[18] geçersiz token girilirse doğru mesaj', async () => {
      const res = await request(server).get('/api/users').set('Authorization', 'foobar')
      expect(res.body.message).toMatch(/token gecersizdir/i)
    }, 750)
    it('[19] token geçerliyse doğru kullanıcı listesi', async () => {
      let res = await request(server).post('/api/auth/login').send({ username: 'bob', password: '1234' })
      res = await request(server).get('/api/users').set('Authorization', res.body.token)
      expect(res.body).toMatchObject([{ "role_name": "admin", "user_id": 1, "username": "bob" }, { "role_name": "instructor", "user_id": 2, "username": "sue" }])
    }, 750)
  })
  describe('[GET] /api/users/:user_id', () => {
    it('[20] role_name admin ile tokenlı istekler, kullanıcı dizisni alır', async () => {
      let res = await request(server).post('/api/auth/login').send({ username: 'bob', password: '1234' })
      res = await request(server).get('/api/users/1').set('Authorization', res.body.token)
      expect(res.body).toMatchObject({ "role_name": "admin", "user_id": 1, "username": "bob" })
    }, 750)
    it('[21] admin olmayan bir role_name belirteci olan sorgular, uygun durum ve mesajla geri döner', async () => {
      let res = await request(server).post('/api/auth/login').send({ username: 'sue', password: '1234' })
      res = await request(server).get('/api/users/1').set('Authorization', res.body.token)
      expect(res.body.message).toMatch(/bu, senin i/i)
      expect(res.status).toBe(403)
    }, 750)
  })
})
