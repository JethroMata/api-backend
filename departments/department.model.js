const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const attributes = {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    departmentName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING
    },
    employeeCounts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  };

  const options = {
    tableName: 'departments',
    timestamps: false
  };

  const Department = sequelize.define('Department', attributes, options);

  Department.associate = (models) => {
    Department.hasMany(models.Employee, {
      foreignKey: 'departmentId',
      as: 'Employees'
    });
  };

  return Department;
};
