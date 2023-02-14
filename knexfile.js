// DEĞİŞİKLİK YAPMAYIN
const sharedConfig = {
  client: 'sqlite3',
  migrations: {
    directory: './data/migrations',
  },
  seeds: {
    directory: './data/seeds',
  },
   // SQLite için aşağıdaki satırları ekliyoruz
  useNullAsDefault: true,
  // aşağıdaki satır foreign keys'i SQLite'da aktifleştirir
  pool: {
    afterCreate: (conn, done) => {
      conn.run('PRAGMA foreign_keys = ON', done)
    },
  },
}

module.exports = {
  development: {
    ...sharedConfig,
    connection: { filename: './data/auth.db3' },
  },
  testing: {
    ...sharedConfig,
    connection: { filename: './data/testing.db3' },
  },
}
