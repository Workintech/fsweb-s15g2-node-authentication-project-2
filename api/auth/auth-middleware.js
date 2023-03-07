const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../secrets/index"); // bu secreti kullanın!
const User = require("../users/users-model");
const sinirli = (req, res, next) => {
  /*
    Eğer Authorization header'ında bir token sağlanmamışsa:
    status: 401
    {
      "message": "Token gereklidir"
    }

    Eğer token doğrulanamıyorsa:
    status: 401
    {
      "message": "Token gecersizdir"
    }

    Alt akıştaki middlewarelar için hayatı kolaylaştırmak için kodu çözülmüş tokeni req nesnesine koyun!
  */
  const token = req.headers.authorization; //tokenı aldık
  if (token) {
    //token olmayabilir
    //token var ve geçerli
    jwt.verify(token, JWT_SECRET, (err, decodedJWT) => {
      //verify 3 tane argüman alıyor token secret hata varsa err düşecek yoksa decodenJWT
      if (err) {
        //token var,geçersiz
        next({
          status: 401,
          message: "token gecersizdir",
        });
      } else {
        //token var geçerli
        req.decodedJWT = decodedJWT;
        next(); //kullanıcyı bir sonraki middleware gönderiyoruz
      }
    });
  } else {
    next({ status: 401, message: "token gereklidir" });
  }
};

const sadece = (role_name) => (req, res, next) => {
  /*
	Kullanıcı, Authorization headerında, kendi payloadu içinde bu fonksiyona bağımsız değişken olarak iletilen 
	rol_adı ile eşleşen bir role_name ile bir token sağlamazsa:
    status: 403
    {
      "message": "Bu, senin için değil"
    }

    Tekrar authorize etmekten kaçınmak için kodu çözülmüş tokeni req nesnesinden çekin!
  */
  if (req.decodedJWT && req.decodedJWT.role_name === role_name) {
    next();
  } else {
    next({ status: 403, message: "Bu, senin için değil" });
  }
};

const usernameVarmi = async (req, res, next) => {
  /*
    req.body de verilen username veritabanında yoksa
    status: 401
    {
      "message": "Geçersiz kriter"
    }
  */
  try {
    const presentUser = await User.goreBul({
      username: req.body.username,
    });
    if (!presentUser.length) {
      //array döneceği için uzunluğu 0 olanı yani boş olanı için yazdık
      next({ status: 401, message: "Geçersiz kriter" });
    } else {
      req.user = presentUser[0];
      next();
    }
  } catch (error) {
    next(error);
  }
};

const rolAdiGecerlimi = async (req, res, next) => {
  /*
    Bodydeki role_name geçerliyse, req.role_name öğesini trimleyin ve devam edin.

    Req.body'de role_name eksikse veya trimden sonra sadece boş bir string kaldıysa,
    req.role_name öğesini "student" olarak ayarlayın ve isteğin devam etmesine izin verin.

    Stringi trimledikten sonra kalan role_name 'admin' ise:
    status: 422
    {
      "message": "Rol adı admin olamaz"
    }

    Trimden sonra rol adı 32 karakterden fazlaysa:
    status: 422
    {
      "message": "rol adı 32 karakterden fazla olamaz"
    }
  */
  try {
    const { role_name } = req.body;
    if (!role_name || role_name.trim() === "") {
      //role_name eksikse veya trimden sonra sadece boş bir string kaldıysa
      req.role_name = "student";
      next();
    } else if (role_name.trim() === "admin") {
      //Stringi trimledikten sonra kalan role_name 'admin' ise
      next({ status: 422, message: "Rol adı admin olamaz" });
    } else if (role_name.trim().length > 32) {
      //Trimden sonra rol adı 32 karakterden fazlaysa
      next({ status: 422, message: "rol adı 32 karakterden fazla olamaz" });
    } else {
      req.role_name = role_name.trim();
      next();
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sinirli,
  usernameVarmi,
  rolAdiGecerlimi,
  sadece,
};
