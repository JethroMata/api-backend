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
    positionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'positionId'
    },

    // ✅ Manager ID — store EmployeeID as string, no FK constraint
    managerId: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'managerId',
      comment: 'EmployeeID of the manager supervising this employee'
    },

    // ✅ Head (still references Accounts)
    headId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'HeadID',
      references: {
        model: 'accounts',
        key: 'id'
      }
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
      as: 'Department',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // ✅ Logical (non-FK) manager/subordinate relationship
    Employee.hasMany(models.Employee, {
      foreignKey: 'managerId',
      sourceKey: 'EmployeeID',
      as: 'Subordinates'
    });

    Employee.belongsTo(models.Employee, {
      foreignKey: 'managerId',
      targetKey: 'EmployeeID',
      as: 'Manager'
    });
  };

  return Employee;
};
