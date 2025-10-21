// services/employee.service.js
const db = require('_helpers/db');
const logWorkflow = require('_helpers/workflow-logger');

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
  getManagers,
  generateNextEmployeeID,
};

// ====== QUERIES ======
async function getAll() {
  return await db.Employee.findAll({
    include: [
      {
        model: db.Account,
        as: 'Account',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: db.Department,
        as: 'Department',
        attributes: ['id', 'departmentName'],
      },
      {
        model: db.Employee,
        as: 'Head',
        include: [
          {
            model: db.Account,
            as: 'Account',
            attributes: ['firstName', 'lastName', 'email'],
          },
        ],
      },
    ],
    order: [['EmployeeID', 'ASC']],
  });
}

async function getById(id) {
  return await db.Employee.findByPk(id, {
    include: [
      { model: db.Account, as: 'Account' },
      {
        model: db.Department,
        as: 'Department',
        attributes: ['id', 'departmentName', 'employeeCounts'],
      },
      {
        model: db.Employee,
        as: 'Head',
        include: [
          {
            model: db.Account,
            as: 'Account',
            attributes: ['firstName', 'lastName', 'email'],
          },
        ],
      },
    ],
  });
}

async function getManagers() {
  const managers = await db.Employee.findAll({
    where: db.Sequelize.where(
      db.Sequelize.fn('LOWER', db.Sequelize.col('position')),
      'manager'
    ),
    include: [
      {
        model: db.Account,
        as: 'Account',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
    order: [['EmployeeID', 'ASC']],
  });

  return managers.map((m) => ({
    id: m.id,
    employeeId: m.EmployeeID,
    firstName: m.Account?.firstName,
    lastName: m.Account?.lastName,
    email: m.Account?.email,
    position: m.position,
  }));
}

async function generateNextEmployeeID() {
  const last = await db.Employee.findOne({ order: [['EmployeeID', 'DESC']] });
  let nextNum = 1;
  if (last && last.EmployeeID) {
    const match = String(last.EmployeeID).match(/EMP0*([0-9]+)$/i);
    if (match && match[1]) nextNum = parseInt(match[1], 10) + 1;
    else nextNum = (await db.Employee.count()) + 1;
  }
  return `EMP${String(nextNum).padStart(3, '0')}`;
}

// ====== CREATE ======
async function resolveAccount(params) {
  if (params.accountId) {
    const account = await db.Account.findByPk(params.accountId);
    if (!account) throw 'Related account not found for given accountId';
    return account;
  }
  if (params.email) {
    const account = await db.Account.findOne({ where: { email: params.email } });
    if (!account) throw 'Related account not found for given email';
    return account;
  }
  throw 'Please supply accountId or email for related account';
}

async function create(params) {
  // Normalize incoming names
  if (params.departmentId && !params.DepartmentID)
    params.DepartmentID = params.departmentId;
  if (params.managerId && !params.headId) params.headId = params.managerId;

  const account = await resolveAccount(params);
  const status = (params.status || 'active').toString().toLowerCase();

  // ===== DEBUG LOGS =====
  console.log('Account resolved:', account?.firstName, account?.lastName);
  // record params before creating to verify values
  console.log('Params before create:', JSON.stringify(params));
  // ======================

  // Copy Account name into employee fields so NOT NULL constraints (if any) are satisfied
  params.firstName = params.firstName || account.firstName || null;
  params.lastName = params.lastName || account.lastName || null;

  const existing = await db.Employee.findOne({
    where: { accountId: account.id },
  });
  if (existing) throw 'Employee for this account already exists';

  const base = {
    accountId: account.id,
    position: params.position || null,
    DepartmentID: params.DepartmentID || null,
    headId: params.headId || null,
    hireDate: params.hireDate || null,
    status,
    created: new Date(),
    firstName: params.firstName,
    lastName: params.lastName,
  };

  let employee;

  if (params.EmployeeID) {
    if (await db.Employee.findByPk(params.EmployeeID)) {
      throw `EmployeeID ${params.EmployeeID} already exists`;
    }
    employee = new db.Employee({ ...base, EmployeeID: params.EmployeeID });
    await employee.save();
  } else {
    for (let attempt = 1; attempt <= 5; attempt++) {
      const candidateId = await generateNextEmployeeID();
      try {
        employee = new db.Employee({ ...base, EmployeeID: candidateId });
        await employee.save();
        break;
      } catch (err) {
        const msg = err && err.message ? err.message.toLowerCase() : '';
        const uniqueError =
          msg.includes('unique') ||
          msg.includes('duplicate') ||
          err.name === 'SequelizeUniqueConstraintError';
        if (uniqueError && attempt < 5) continue;
        throw err;
      }
    }
  }

  if (employee.DepartmentID) await updateDepartmentCount(employee.DepartmentID);

  await logWorkflow(
    employee.EmployeeID,
    'Employee Created',
    `Employee linked to account ${account.email}`
  );

  return await getById(employee.EmployeeID);
}

// ====== UPDATE ======
async function update(id, params) {
  if (params.departmentId && !params.DepartmentID)
    params.DepartmentID = params.departmentId;
  if (params.managerId && !params.headId) params.headId = params.managerId;

  const employee = await db.Employee.findByPk(id);
  if (!employee) throw 'Employee not found';

  const oldDept = employee.DepartmentID;
  const oldStatus = employee.status;

  if (params.accountId && params.accountId !== employee.accountId) {
    const account = await db.Account.findByPk(params.accountId);
    if (!account) throw 'Related account not found for new accountId';
    const duplicate = await db.Employee.findOne({
      where: { accountId: params.accountId },
    });
    if (duplicate) throw 'Employee for this account already exists';

    // If account changed, update name fields from new account
    employee.accountId = params.accountId;
    employee.firstName = account.firstName || employee.firstName;
    employee.lastName = account.lastName || employee.lastName;

    await logWorkflow(
      employee.EmployeeID,
      'Account Changed',
      `Employee assigned to account ${account.email}`
    );
  }

  const allowed = [
    'position',
    'DepartmentID',
    'hireDate',
    'status',
    'headId',
    'firstName',
    'lastName',
  ];

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      employee[key] = params[key];
    }
  }

  await employee.save();

  if (oldDept !== employee.DepartmentID) {
    if (oldDept) await updateDepartmentCount(oldDept);
    if (employee.DepartmentID)
      await updateDepartmentCount(employee.DepartmentID);
  }

  if (oldStatus !== employee.status) {
    await logWorkflow(
      employee.EmployeeID,
      'Status Changed',
      `Status changed from ${oldStatus} to ${employee.status}`
    );
  }

  return await getById(employee.EmployeeID);
}

// ====== DELETE ======
async function _delete(id) {
  const emp = await db.Employee.findByPk(id);
  if (!emp) throw 'Employee not found';
  const deptId = emp.DepartmentID;
  await emp.destroy();
  if (deptId) await updateDepartmentCount(deptId);
}

// ====== Helpers ======
async function updateDepartmentCount(deptId) {
  const dept = await db.Department.findByPk(deptId, {
    include: [
      { model: db.Employee, as: 'Employees', attributes: ['EmployeeID'] },
    ],
  });
  if (!dept) return;
  dept.employeeCounts = dept.Employees ? dept.Employees.length : 0;
  await dept.save();
}
