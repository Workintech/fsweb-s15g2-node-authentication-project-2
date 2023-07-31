const router = require("express").Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { usernameVarmi, rolAdiGecerlimi } = require('./auth-middleware');
const { JWT_SECRET, HASH_ROUND } = require("../secrets"); // bu secret'ı kullanın!
const User = require('../users/users-model');

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
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, HASH_ROUND);
    const user = await User.ekle({ username: username, password: hashedPassword, role_name: req.role_name });
    res.status(201).json(user)
  } catch (error) {
    next(error)
  }
});


router.post("/login", usernameVarmi, async (req, res, next) => {
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
  const { username, password } = req.body;
  const [user] = await User.goreBul({ username: username });
  if (user && bcrypt.compareSync(password, user.password)) {
    const payload = {
      subject: user.user_id,
      username: user.username,
      role_name: user.role_name
    }
    const options = {
      expiresIn: '24h'
    }

    const token = jwt.sign(payload, JWT_SECRET, options);
    res.json({ message: `${user.username} geri geldi!`, token: token })
  } else {
    next({ status: 401, message: 'Gecersiz kriter' })
  }
});

module.exports = router;