const router = require("express").Router();
const { usernameVarmi, rolAdiGecerlimi } = require('./auth-middleware');
const { JWT_SECRET } = require("../secrets"); // bu secret'ı kullanın!
const userModel = require("../users/users-model")
const jwt = require("jsonwebtoken");



router.post("/register", rolAdiGecerlimi, async (req, res, next) => {
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

    response:
    status: 201
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
  try {
    let model = {
      username: req.body.username,
      password: req.body.password,
      role_name: req.body.role_name
    }
    let insertedUser = await userModel.ekle(model);
    res.status(201).json(insertedUser);
  } catch (error) {
    next(error);

  }
});


router.post("/login", usernameVarmi, (req, res, next) => {
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }

    response:
    status: 200
    {
      "message": "sue geri geldi!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }

    Token 1 gün sonra timeout olmalıdır ve aşağıdaki bilgiyi payloadında içermelidir:

    {
      "subject"  : 1       // giriş yapan kullanıcının user_id'si
      "username" : "bob"   // giriş yapan kullanıcının username'i
      "role_name": "admin" // giriş yapan kulanıcının role adı
    }
   */
  try {
    const { password } = req.body;
    const isValidPassword = bcrypt.compare(password, req.user.password);
    if (!isValidPassword) {
      next({
        status: 401,
        message: "Yanlış şifre"

      })

    } else {
      let token = jwt.sign({
        subject: req.user.user_id,
        username: req.user.username,
        role_name: req.user.role_name


      }, JWT_SECRET, { expiresIn: "1d" });
      res.status(200).json({
        message: `${req.user.username} geri geldi!`,
        token: token
      });

    }
  } catch (error) {
    next(error);

  }

});

module.exports = router;
