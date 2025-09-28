const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const attributes = {
    EmployeeID: {
      type: DataTypes.STRING(32),
      allowNull: false,
      primaryKey: true,
      unique: true,
      field: 'EmployeeID'
    },
    accountId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'accountId'
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true
    },
    departmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'DepartmentID'
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'hireDate'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'updated'
    }
  };

  const options = {
    tableName: 'employees',
    timestamps: true,
    createdAt: 'created',
    updatedAt: 'updated'
  };

  const Employee = sequelize.define('Employee', attributes, options);

  Employee.associate = (models) => {
    Employee.belongsTo(models.Account, {
      foreignKey: 'accountId',
      as: 'Account',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Employee.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'Department', // ✅ must match service include
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  return Employee;
};
