const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
    employee_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: DataTypes.STRING,
    dob: DataTypes.DATEONLY,
    visa_type: DataTypes.STRING,
    visa_status: DataTypes.STRING,
    visa_expiry: DataTypes.DATEONLY,
    joining_date: DataTypes.DATEONLY,
    designation: DataTypes.STRING,
    department: DataTypes.STRING,
    basic_salary: DataTypes.DECIMAL(10, 2),
    allowance: DataTypes.DECIMAL(10, 2),
    accommodation_allowance: DataTypes.DECIMAL(10, 2),
    sales_commission: DataTypes.DECIMAL(10, 2),
    bar_commission: DataTypes.DECIMAL(10, 2),
    paid_leaves: DataTypes.INTEGER,
    overtime_rate: DataTypes.DECIMAL(10, 2),
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
    }
});

module.exports = Employee;
