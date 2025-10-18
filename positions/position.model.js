const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Position = sequelize.define('Position', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    roleType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'positions',
    timestamps: false
  });

  Position.associate = (models) => {
    Position.hasMany(models.Employee, {
      foreignKey: 'positionId',
      as: 'Employees',
      onDelete: 'SET NULL'
    });
  };

  return Position;
};
