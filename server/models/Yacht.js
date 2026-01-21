const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Yacht = sequelize.define('Yacht', {
    yacht_name: DataTypes.STRING,
    capacity: DataTypes.INTEGER,
    price_per_hour: DataTypes.DECIMAL(10, 2),
    status: DataTypes.STRING
});

module.exports = Yacht;
