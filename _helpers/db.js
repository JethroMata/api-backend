// _helpers/db.js
const mysql = require('mysql2/promise');
const config = require('config.json');
const { Sequelize } = require('sequelize');

const db = {};
module.exports = db;

initialize().catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});

async function initialize() {
  const { host, port, user, password, database } = config.database;

  if (!host || !user || !database) {
    throw new Error('Missing database configuration in config.json');
  }

  // Ensure database exists
  const createConn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await createConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    console.info(`[DB] Ensured database "${database}" exists.`);
  } finally {
    await createConn.end();
  }

  // Initialize Sequelize with SSL
  const sequelize = new Sequelize(database, user, password, {
    host,
    port,
    dialect: 'mysql',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    },
    logging: msg => console.debug('[sequelize]', msg),
    define: { timestamps: true },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  // ==============================
  // MODELS
  // ==============================
  db.Account = require('../accounts/account.model.js')(sequelize);
  db.RefreshToken = require('../accounts/refresh-token.model.js')(sequelize);
  db.Employee = require('../employees/employee.model.js')(sequelize);
  db.Department = require('../departments/department.model.js')(sequelize);
  db.Request = require('../requests/request.model.js')(sequelize);
  db.EmployeeWorkflow = require('../employees/employee-workflow.model.js')(sequelize);
  db.Position = require('../positions/position.model.js')(sequelize);

  // ==============================
  // ASSOCIATIONS
  // ==============================

  // Account ↔ RefreshToken
  if (db.Account && db.RefreshToken) {
    db.Account.hasMany(db.RefreshToken, { foreignKey: 'accountId', onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account, { foreignKey: 'accountId' });
  }

  // Account ↔ Employee
  if (db.Account && db.Employee) {
    db.Account.hasOne(db.Employee, { as: 'Employee', foreignKey: 'accountId', onDelete: 'CASCADE' });
    db.Employee.belongsTo(db.Account, { as: 'Account', foreignKey: 'accountId' });
  }

  // Department ↔ Employee
  if (db.Department && db.Employee) {
    db.Department.hasMany(db.Employee, { as: 'Employees', foreignKey: 'DepartmentID', onDelete: 'SET NULL' });
    db.Employee.belongsTo(db.Department, { as: 'Department', foreignKey: 'DepartmentID' });
  }

  // Account ↔ Request
  if (db.Account && db.Request) {
    db.Account.hasMany(db.Request, { foreignKey: 'accountId', onDelete: 'CASCADE' });
    db.Request.belongsTo(db.Account, { foreignKey: 'accountId' });
  }

  // Position ↔ Employee
  if (db.Position && db.Employee) {
    db.Position.hasMany(db.Employee, {
      foreignKey: 'positionId',
      as: 'Employees',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    db.Employee.belongsTo(db.Position, {
      foreignKey: 'positionId',
      as: 'Position',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  }

  // ✅ Employee ↔ Manager (self-reference)
  // ✅ Employee ↔ Head (self-reference)
if (db.Employee) {
  db.Employee.belongsTo(db.Employee, {
    as: 'Head',
    foreignKey: 'headId',
    targetKey: 'EmployeeID',
    onDelete: 'SET NULL'
  });
  db.Employee.hasMany(db.Employee, {
    as: 'Subordinates',
    foreignKey: 'headId',
    sourceKey: 'EmployeeID',
    onDelete: 'SET NULL'
  });
}


  // ✅ Employee ↔ EmployeeWorkflow
  if (db.EmployeeWorkflow && db.Employee) {
    db.Employee.hasMany(db.EmployeeWorkflow, {
      foreignKey: 'employeeId',
      sourceKey: 'EmployeeID',
      as: 'Workflows',
      constraints: false
    });
    db.EmployeeWorkflow.belongsTo(db.Employee, {
      foreignKey: 'employeeId',
      targetKey: 'EmployeeID',
      as: 'Employee',
      constraints: false
    });
  }

  // ==============================
  // SYNC MODELS
  // ==============================
  try {
    console.info('[DB] Syncing models to database (force=false).');
    await sequelize.sync({ force: false });
    console.info('[DB] Sequelize sync completed.');
  } catch (syncErr) {
    console.error('[DB] Sequelize sync failed:', syncErr);
    throw syncErr;
  }
}
