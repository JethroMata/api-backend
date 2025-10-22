// employees/employee-workflow.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmployeeWorkflow = sequelize.define(
    'EmployeeWorkflow',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      employeeId: { type: DataTypes.STRING(32), allowNull: false },
      action: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'employee_workflows',
      timestamps: true, // ✅ match global define: { timestamps: true }
      createdAt: 'createdAt',
      updatedAt: false, // ✅ skip updatedAt column if not used
    }
  );

  EmployeeWorkflow.associate = (models) => {
    if (models.Employee) {
      EmployeeWorkflow.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        targetKey: 'EmployeeID',
        as: 'Employee',
        constraints: false,
      });
    }
  };

  return EmployeeWorkflow;
};
