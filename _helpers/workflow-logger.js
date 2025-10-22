// _helpers/workflow-logger.js
const db = require('./db');

/**
 * Get readable department name by ID
 */
async function getDeptNameById(id) {
  try {
    if (!id || isNaN(id)) return null;

    // Use Department model (confirmed from db.js)
    const dept = await db.Department.findByPk(id);
    if (!dept) return null;

    // ✅ Your field is departmentName (lowercase d)
    return dept.departmentName || null;
  } catch (err) {
    console.error('Error in getDeptNameById:', err);
    return null;
  }
}

/**
 * Log workflow entry with proper department names
 */
async function logWorkflow(employeeId, action, description = null, fromDeptId = null, toDeptId = null) {
  try {
    const fromDeptName = await getDeptNameById(fromDeptId);
    const toDeptName = await getDeptNameById(toDeptId);

    let finalDescription;
    if (description) {
      finalDescription = description;
    } else if (fromDeptName && toDeptName) {
      finalDescription = `Moved from department ${fromDeptName} to ${toDeptName}`;
    } else if (!fromDeptName && toDeptName) {
      finalDescription = `Moved to department ${toDeptName}`;
    } else if (fromDeptName && !toDeptName) {
      finalDescription = `Moved from department ${fromDeptName}`;
    } else {
      finalDescription = 'Department updated';
    }

    await db.EmployeeWorkflow.create({
      employeeId,
      action,
      description: finalDescription,
      createdAt: new Date(),
    });

    console.log(`✅ Workflow logged for ${employeeId}: ${finalDescription}`);
  } catch (err) {
    console.error('❌ Error logging workflow:', err);
  }
}

module.exports = logWorkflow;
