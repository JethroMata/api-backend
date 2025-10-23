// requests/index.js
const express = require('express');
const router = express.Router();
const controller = require('./request.controller');
const authorize = require('_middleware/authorize');


router.get('/', controller.getAll);
router.get('/pending', authorize(), controller.getPending);
router.get('/:requestId', controller.getById);
router.post('/', controller.createSchema, controller.create);
router.put('/:requestId', controller.updateSchema, controller.update);
router.post('/:requestId', controller.updateSchema, controller.update);
router.post('/:requestId/approve', controller.approve);
router.post('/:requestId/reject', controller.reject);
router.delete('/:requestId', controller.delete);

module.exports = router;
