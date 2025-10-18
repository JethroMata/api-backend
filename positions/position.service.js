const db = require('_helpers/db');

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: _delete
};

// ====== GET ALL ======
async function getAll() {
  return await db.Position.findAll({
    attributes: ['id', 'roleType', 'status'],
    order: [['id', 'ASC']],
    include: [{ model: db.Employee, as: 'Employees', attributes: ['EmployeeID', 'status'] }]
  });
}


// ====== GET BY ID ======
async function getById(id) {
  const position = await db.Position.findByPk(id, {
    attributes: ['id', 'roleType', 'status'],
    include: [{ model: db.Employee, as: 'Employees', attributes: ['EmployeeID', 'status'] }]
  });
  if (!position) throw 'Position not found';
  return position;
}

// ====== CREATE ======
async function create(params) {
  if (!params.roleType) throw 'roleType is required';

  const exists = await db.Position.findOne({ where: { roleType: params.roleType } });
  if (exists) throw `Position "${params.roleType}" already exists`;

  const position = new db.Position({
    roleType: params.roleType,
    status: params.status || 'active'
  });

  await position.save();
  return { id: position.id, roleType: position.roleType, status: position.status };
}

// ====== UPDATE ======
async function update(id, params) {
  const position = await getById(id);
  if (!position) throw 'Position not found';

  if (params.id && params.id !== id) {
    const newId = params.id;
    const existing = await db.Position.findByPk(newId);
    if (existing) throw `Position ID ${newId} already exists`;

    await db.Employee.update({ positionId: newId }, { where: { positionId: id } });

    const newPosition = await db.Position.create({
      id: newId,
      roleType: params.roleType || position.roleType,
      status: params.status || position.status
    });

    await position.destroy();
    return { id: newPosition.id, roleType: newPosition.roleType, status: newPosition.status };
  }

  if (params.roleType) position.roleType = params.roleType;
  if (params.status) position.status = params.status;

  await position.save();
  return { id: position.id, roleType: position.roleType, status: position.status };
}

// ====== DELETE ======
async function _delete(id) {
  const position = await getById(id);
  if (!position) throw 'Position not found';
  await position.destroy();
  return { message: 'Position deleted successfully' };
}