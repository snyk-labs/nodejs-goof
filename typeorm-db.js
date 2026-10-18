var typeorm = require("typeorm");
var EntitySchema = typeorm.EntitySchema;
var DataSource = typeorm.DataSource; // AI Refactor Patch: TypeORM 0.3.x replaces createConnection with DataSource

const Users = require("./entity/Users")

const UserSchema = new EntitySchema(Users); // AI Refactor Patch: Prepare EntitySchema instance for 0.3.x APIs and avoid string-based lookups

const dataSource = new DataSource({ // AI Refactor Patch: Use DataSource to configure connection in TypeORM 0.3.x
  name: "mysql",
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "root",
  database: "acme",
  synchronize: true,
  "logging": true,
  entities: [
    UserSchema // AI Refactor Patch: Register schema instance instead of using string entity names
  ]
});

dataSource.initialize().then(() => { // AI Refactor Patch: initialize the DataSource instead of createConnection/getConnection
  const repo = dataSource.getRepository(UserSchema); // AI Refactor Patch: getRepository by schema target (string names removed in 0.3.x)
  return repo
}).then((repo) => {


  console.log('Seeding 2 users to MySQL users table: Liran (role: user), Simon (role: admin')
  const inserts = [
    repo.insert({
      name: "Liran",
      address: "IL",
      role: "user"
    }),
    repo.insert({
      name: "Simon",
      address: "UK",
      role: "admin"
    })
  ];

  return Promise.all(inserts)
}).catch((err) => {
  console.error('failed connecting and seeding users to the MySQL database')
  console.error(err)
})
