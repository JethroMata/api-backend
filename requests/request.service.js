const db = require('_helpers/db');
const logWorkflow = require('_helpers/workflow-logger'); // 🔹 added

module.exports = {
  getAll,
  getPending,
  getPendingByManager, // ✅ added
  updateStatus,
  getById,
  create,
  update,
  delete: _delete
};

const ALLOWED_TYPES = ['equipment', 'leave', 'resources'];
const ALLOWED_STATUS = ['draft', 'pending', 'approved', 'rejected'];

// ------------------------- Get all -------------------------
async function getAll() {
  return await db.Request.findAll({
    include: [{ model: db.Account, attributes: ['id', 'email', 'firstName', 'lastName'], required: false }],
    order: [['created', 'DESC']]
  });
}

async function getPending(currentUserAccountId) {
  const manager = await resolveEmployeeFromAccount(currentUserAccountId);
  if (!manager) throw 'Manager record not found for current user';

  return await db.Request.findAll({
    where: {
      status: 'pending',
      headId: manager.EmployeeID, // ✅ only requests for this manager
    },
    include: [
      {
        model: db.Account,
        attributes: ['id', 'email', 'firstName', 'lastName'],
        required: false,
      },
    ],
    order: [['created', 'DESC']],
  });
}

async function updateStatus(requestId, status) {
  const request = await db.Request.findByPk(requestId);
  if (!request) throw 'Request not found';

  if (!['approved', 'rejected'].includes(status)) throw 'Invalid status change';

  request.status = status;
  request.updated = new Date();
  await request.save();

  return await getById(requestId);
}

// ------------------------- Get Pending by Manager -------------------------
async function getPendingByManager(accountId) {
  if (!accountId) throw 'Missing accountId of current user';

  // 1️⃣ Find the manager’s Employee record
  const manager = await db.Employee.findOne({ where: { accountId } });
  if (!manager) return [];

  // 2️⃣ Find employees whose headId = manager.EmployeeID
  const subordinates = await db.Employee.findAll({
    where: { headId: manager.EmployeeID },
    attributes: ['EmployeeID', 'accountId']
  });

  if (!subordinates || subordinates.length === 0) return [];

  const subordinateAccountIds = subordinates.map(e => e.accountId);

  // 3️⃣ Get requests belonging to subordinates that are pending
  const pendingRequests = await db.Request.findAll({
    where: {
      status: 'pending',
      accountId: subordinateAccountIds
    },
    include: [
      {
        model: db.Account,
        attributes: ['id', 'email', 'firstName', 'lastName'],
        required: false
      }
    ],
    order: [['created', 'DESC']]
  });

  return pendingRequests;
}

// ------------------------- Get by requestId -------------------------
async function getById(requestId) {
  if (!requestId) return null;
  return await db.Request.findByPk(requestId, {
    include: [{ model: db.Account, attributes: ['id', 'email', 'firstName', 'lastName'], required: false }],
  });
}

// ------------------------- Helpers -------------------------
async function resolveAccountIdFromEmail(email) {
  if (!email) return null;
  const account = await db.Account.findOne({ where: { email } });
  return account ? account.id : null;
}

async function resolveEmployeeFromAccount(accountId) {
  if (!accountId) return null;
  return await db.Employee.findOne({ where: { accountId } });
}

// ------------------------- Create -------------------------
async function create(params) {
  let accountId = params.accountId ?? null;
  if (!accountId && params.employeeEmail) {
    const acc = await db.Account.findOne({ where: { email: params.employeeEmail } });
    if (acc) accountId = acc.id;
  }
  if (!accountId) throw 'accountId is required';

  // validate fields
  if (!ALLOWED_TYPES.includes(params.type)) throw 'Invalid request type';
  if (!params.items || String(params.items).trim() === '') throw 'items is required';
  const qty = Number(params.quantity);
  if (!Number.isFinite(qty) || qty < 1) throw 'quantity must be >= 1';
  if (params.status && !ALLOWED_STATUS.includes(params.status)) throw 'Invalid status';

  // ✅ find employee submitting this request
  const employee = await resolveEmployeeFromAccount(accountId);
  if (!employee) throw 'Employee not found for this account';
  const headId = employee.headId || null; // direct manager’s EmployeeID

  // ✅ create request with headId
  const r = await db.Request.create({
    accountId,
    headId,
    type: params.type,
    items: String(params.items).trim(),
    quantity: Math.trunc(qty),
    status: params.status || 'draft',
    created: new Date(),
  });

  // log workflow
  await logWorkflow(
    employee.EmployeeID,
    'Request Created',
    `Request #${r.requestId} (${r.type}) created for ${r.items} x${r.quantity}`
  );

  return await getById(r.requestId);
}

// ------------------------- Update -------------------------
async function update(requestId, params) {
  const request = await db.Request.findByPk(requestId);
  if (!request) throw 'Request not found';

  // 🔒 Allow draft → pending, block everything else
if (['approved', 'rejected'].includes(request.status)) {
  throw `Cannot edit an ${request.status.toUpperCase()} request`;
}

// ✅ Allow transition from draft → pending
if (request.status === 'draft' && params.status === 'pending') {
  request.status = 'pending';
  request.updated = new Date();
  await request.save();
  return await getById(requestId);
}

  // If employeeEmail provided and accountId not, try to resolve
  if (!params.accountId && params.employeeEmail) {
    const resolved = await resolveAccountIdFromEmail(params.employeeEmail);
    if (resolved) params.accountId = resolved;
  }

  // If changing accountId, validate account exists
  if (params.accountId && params.accountId !== request.accountId) {
    const account = await db.Account.findByPk(params.accountId);
    if (!account) throw 'Related account not found for new accountId';
  }

  // validate type/status if present
  if (params.type && !ALLOWED_TYPES.includes(params.type)) throw 'Invalid request type';
  if (params.status && !ALLOWED_STATUS.includes(params.status)) throw 'Invalid status';

  // validate items/quantity if provided
  if (Object.prototype.hasOwnProperty.call(params, 'items')) {
    if (!params.items || String(params.items).trim() === '') {
      throw 'items cannot be empty';
    }
    request.items = String(params.items).trim();
  }

  if (Object.prototype.hasOwnProperty.call(params, 'quantity')) {
    const qty = Number(params.quantity);
    if (!Number.isFinite(qty) || qty < 1) throw 'quantity must be an integer >= 1';
    request.quantity = Math.trunc(qty);
  }

  // copy other allowed fields
  const allowed = ['accountId', 'type', 'status'];
  for (const f of allowed) {
    if (Object.prototype.hasOwnProperty.call(params, f)) {
      request[f] = params[f];
    }
  }

  request.updated = new Date();
  await request.save();

  // 🔹 log workflow
  const employee = await resolveEmployeeFromAccount(request.accountId);
  if (employee) {
    await logWorkflow(
      employee.EmployeeID,
      'Request Updated',
      `Request #${request.id || request.requestId} updated (status: ${request.status})`
    );
  }

  const pk = request.requestId ?? request.id ?? null;
  return await getById(pk);
}

// ------------------------- Delete -------------------------
async function _delete(requestId) {
  const r = await db.Request.findByPk(requestId);
  if (!r) throw 'Request not found';
  const emp = await resolveEmployeeFromAccount(r.accountId);

  await r.destroy();

  // 🔹 log workflow
  if (emp) {
    await logWorkflow(
      emp.EmployeeID,
      'Request Deleted',
      `Request #${requestId} was deleted`
    );
  }
}

// if (params.status === 'pending' && request.status === 'draft') {
//   // Transition draft → pending
//   await logWorkflow(employee.EmployeeID, 'Request Submitted', `Request #${requestId} submitted for approval.`);
// }


