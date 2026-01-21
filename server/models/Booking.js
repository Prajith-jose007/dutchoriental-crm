const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
    booking_ref: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    yacht_id: DataTypes.STRING,
    package_id: DataTypes.STRING,
    agent_id: DataTypes.STRING,
    customer_name: DataTypes.STRING,
    customer_phone: DataTypes.STRING,
    customer_email: DataTypes.STRING,
    booking_date: DataTypes.DATEONLY,
    booking_time: DataTypes.STRING,
    number_of_people: DataTypes.INTEGER,
    base_price: DataTypes.DECIMAL(10, 2),
    discount_amount: DataTypes.DECIMAL(10, 2),
    total_price: DataTypes.DECIMAL(10, 2),
    status: {
        type: DataTypes.STRING,
        defaultValue: 'confirmed'
    },
    notes: DataTypes.TEXT
});

module.exports = Booking;
