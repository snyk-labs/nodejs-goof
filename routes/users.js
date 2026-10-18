var express = require('express')
var typeorm = require("typeorm");

var router = express.Router()
module.exports = router

router.get('/', async (req, res, next) => {

  const mongoConnection = typeorm.getConnection('mysql')
  const repo = mongoConnection.getRepository("Users")

  // hard-coded getting account id of 1
  // as a rpelacement to getting this from the session and such
  // (just imagine that we implemented auth, etc)
  const results = await repo.find({ where: { id: 1 } }) // AI Refactor Patch: TypeORM 0.3+ requires FindOptions with a 'where' clause; find({ id: 1 }) is no longer valid

  // Log a safe debug message instead of accessing Object prototype properties:
  console.log('Fetching user with id = 1') // AI Refactor Patch: Avoid accessing Object.prototype (e.g., {}.where) to prevent leaking/polluted prototype properties

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
    console.log('Failed to create user record') // AI Refactor Patch: Remove access to {}.where to avoid prototype pollution issues in logs
    next();
  }
})
