const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Package = sequelize.define('Package', {
    package_name: DataTypes.STRING,
    yacht_id: DataTypes.STRING,
    base_price: DataTypes.DECIMAL(10, 2),
    description: DataTypes.TEXT,
    duration_hours: DataTypes.INTEGER
});

module.exports = Package;
