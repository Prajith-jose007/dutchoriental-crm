const sequelize = require('../config/database');
const Booking = require('./Booking');
const Employee = require('./Employee');
const Yacht = require('./Yacht');
const Package = require('./Package');
const Agent = require('./Agent');
const User = require('./User');

const models = {
    Booking,
    Employee,
    Yacht,
    Package,
    Agent,
    User
};

// Define associations here if needed
// Example: Booking.belongsTo(Yacht, { foreignKey: 'yacht_id' });

module.exports = models;
