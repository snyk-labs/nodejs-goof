
var express = require('express')
var typeorm = require("typeorm");
var path = require('path');
var fs = require('fs');
var rateLimit = require('express-rate-limit');

var router = express.Router()
module.exports = router

var PROFILE_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'profiles');
var ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

var profileImageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests' }
});

router.get('/:id/profile-image', profileImageLimiter, async (req, res, next) => {
  try {
    var userId = req.params.id;

    if (!/^\d+$/.test(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    var matchingFile = null;
    for (var i = 0; i < ALLOWED_EXTENSIONS.length; i++) {
      var candidate = path.join(PROFILE_IMAGES_DIR, userId + ALLOWED_EXTENSIONS[i]);
      var resolved = path.resolve(candidate);
      if (!resolved.startsWith(path.resolve(PROFILE_IMAGES_DIR))) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      if (fs.existsSync(candidate)) {
        matchingFile = candidate;
        break;
      }
    }

    if (!matchingFile) {
      return res.status(404).json({ error: 'Profile image not found' });
    }

    return res.sendFile(matchingFile);
  } catch (err) {
    next(err);
  }
})

router.get('/', async (req, res, next) => {

  const mongoConnection = typeorm.getConnection('mysql')
  const repo = mongoConnection.getRepository("Users")

  // hard-coded getting account id of 1
  // as a rpelacement to getting this from the session and such
  // (just imagine that we implemented auth, etc)
  const results = await repo.find({ id: 1 })

  // Log Object's where property for debug reasons:
  console.log('The Object.where property is set to: ', {}.where)
  console.log(results)

  return res.json(results)

})

router.post('/', async (req, res, next) => {
  try {
    const mongoConnection = typeorm.getConnection('mysql')
    const repo = mongoConnection.getRepository("Users")

    const user = {}
    user.name = req.body.name
    user.address = req.body.address
    user.role = req.body.role

    const savedRecord = await repo.save(user)
    console.log("Post has been saved: ", savedRecord)
    return res.sendStatus(200)

  } catch (err) {
    console.error(err)
    console.log({}.where)
    next();
  }
})