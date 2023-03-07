/**
  Diğer modüllerin JWT_SECRET'ı require yapabilmesi için bu modülü düzeltin.
 JWT_SECRET'ı  process.env'den alın. .env'den alınamadığı durumlar için de string olarak "shh"ın kullanılmasını sağlayın
 (|| operatörünü kullanabilirsin)

  Eğer bunları sağlamazsanız Testler geçmez ve diğer yazılımcılar bu repoyu klonladıklarında
  projeyi beklendiği gibi çalıştıramazlar.
 */

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || "shh",
};
