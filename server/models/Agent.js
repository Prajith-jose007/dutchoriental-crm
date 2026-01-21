const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Agent = sequelize.define('Agent', {
    agent_name: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    commission_rate: DataTypes.DECIMAL(5, 2),
    status: DataTypes.STRING
});

module.exports = Agent;
