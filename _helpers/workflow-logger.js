// _helpers/workflow-logger.js
const db = require('./db');


async function logWorkflow(employeeId, action, description) {
  if (!employeeId || !action) return;
  try {
    await db.EmployeeWorkflow.create({ employeeId: String(employeeId), action, description });
  } catch (err) {
    // Don't crash the main flow if logging fails — log to console for debugging.
    console.error('Failed to log workflow:', err && err.message ? err.message : err);
  }
}

module.exports = logWorkflow;
