// employees/employee.model.js
module.exports = (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;

  const Employee = sequelize.define(
    'Employee',
    {
      EmployeeID: {
        type: DataTypes.STRING(32),
        allowNull: false,
        primaryKey: true,
      },
      accountId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      position: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      DepartmentID: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      hireDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      created: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      positionId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      headId: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      firstName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: 'employees',
      timestamps: false,
    }
  );

  Employee.associate = (models) => {
    Employee.belongsTo(models.Account, {
      foreignKey: 'accountId',
      as: 'Account',
    });

    Employee.belongsTo(models.Department, {
      foreignKey: 'DepartmentID',
      as: 'Department',
    });

    Employee.belongsTo(models.Employee, {
      foreignKey: 'headId',
      as: 'Head',
    });
  };

  return Employee;
};
