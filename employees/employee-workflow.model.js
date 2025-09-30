// employees/employee-workflow.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmployeeWorkflow = sequelize.define(
    'EmployeeWorkflow',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      // store the employee primary key (EmployeeID) as string to match Employee model
      employeeId: { type: DataTypes.STRING(32), allowNull: false },
      action: { type: DataTypes.STRING, allowNull: false },   // e.g. 'Employee Created'
      description: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    },
    {
      tableName: 'employee_workflows',
      timestamps: false
    }
  );

  // optional association (not required but convenient)
  EmployeeWorkflow.associate = (models) => {
    if (models.Employee) {
      EmployeeWorkflow.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        targetKey: 'EmployeeID',
        as: 'Employee',
        constraints: false // because targetKey isn't a numeric PK Sequelize expects by default
      });
    }
  };

  return EmployeeWorkflow;
};
