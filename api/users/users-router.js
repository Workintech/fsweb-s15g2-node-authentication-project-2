const router = require("express").Router();
const Users = require("./users-model.js");
const { sinirli, sadece } = require("../auth/auth-middleware.js");

/**
  [GET] /api/users

  Bu uç nokta SINIRLIDIR: sadece kimlik kontrolü yapılmış kullanıcılar
  erişebilir.

  response:
  status: 200
  [
    {
      "user_id": 1,
      "username": "bob"
    }
  ]
 */
router.get("/", sinirli, (req, res, next) => { // hazır
  Users.bul()
    .then(users => {
      res.json(users);
    })
    .catch(next);
});

/**
  [GET] /api/users/:user_id

  Bu uçnokta SINIRLIDIR: sadece kimlik denetimi yapılmış ve rolü 'admin' olan kullanıcılar
  erişebilir.

  response:
  status: 200
  [
    {
      "user_id": 1,
      "username": "bob"
    }
  ]
 */
router.get("/:user_id", sinirli, sadece('admin'), (req, res, next) => { // hazır
  Users.idyeGoreBul(req.params.user_id)
    .then(user => {
      res.json(user);
    })
    .catch(next);
});

module.exports = router;
