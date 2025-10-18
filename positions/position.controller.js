const service = require('./position.service');

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: _delete
};

async function getAll(req, res, next) {
  try {
    const result = await service.getAll();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const result = await service.getById(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const result = await service.create(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const result = await service.update(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function _delete(req, res, next) {
  try {
    const result = await service.delete(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
