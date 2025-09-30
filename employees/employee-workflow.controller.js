// employees/employee-workflow.controller.js
const express = require('express');
const router = express.Router();
const db = require('_helpers/db');

// GET /employee-workflows/:employeeId
router.get('/:id', async (req, res, next) => {
  try {
    const employeeId = req.params.id;
    if (!employeeId) return res.status(400).json({ message: 'Employee ID is required' });

    const workflows = await db.EmployeeWorkflow.findAll({
      where: { employeeId },
      order: [['createdAt', 'DESC']]
    });

    res.json(workflows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
