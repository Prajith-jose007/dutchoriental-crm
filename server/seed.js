const sequelize = require('./config/database');
const User = require('./models/User');
const Agent = require('./models/Agent');
const Booking = require('./models/Booking');
const Employee = require('./models/Employee');
const Package = require('./models/Package');
const Yacht = require('./models/Yacht');

async function seed() {
    try {
        await sequelize.sync({ force: true }); // WARNING: This drops tables!
        console.log('Database synced (tables dropped and recreated).');

        // Users
        await User.bulkCreate([
            {
                username: 'admin',
                email: 'admin@dutchcrm.com',
                password: 'password123',
                role: 'admin',
                full_name: 'System Administrator',
                designation: 'owner',
                department: 'management',
                status: 'active',
                app_access: ['crm', 'purchase', 'hrms', 'pos', 'accounts']
            },
            {
                username: 'staff',
                email: 'staff@dutchcrm.com',
                password: 'password123',
                role: 'user',
                full_name: 'Staff Member',
                designation: 'sales_executive',
                department: 'sales',
                status: 'active',
                app_access: ['crm']
            }
        ]);
        console.log('Users seeded.');

        // Yachts
        const yachts = await Yacht.bulkCreate([
            { yacht_name: 'The Flying Dutchman', capacity: 20, price_per_hour: 500.00, status: 'available' },
            { yacht_name: 'Ocean Breeze', capacity: 12, price_per_hour: 350.00, status: 'maintenance' },
            { yacht_name: 'Sea Star', capacity: 8, price_per_hour: 250.00, status: 'available' }
        ]);
        console.log('Yachts seeded.');

        // Packages
        const packages = await Package.bulkCreate([
            { package_name: 'Sunset Cruise', yacht_id: yachts[0].id, base_price: 1200.00, description: '2 hour sunset cruise with drinks', duration_hours: 2 },
            { package_name: 'Full Day Adventure', yacht_id: yachts[2].id, base_price: 2500.00, description: '8 hour cruise with lunch', duration_hours: 8 }
        ]);
        console.log('Packages seeded.');

        // Agents
        const agents = await Agent.bulkCreate([
            { agent_name: 'Top Travel', phone: '+1234567890', email: 'contact@toptravel.com', commission_rate: 10.00, status: 'active' },
            { agent_name: 'Luxury Escapes', phone: '+0987654321', email: 'info@luxuryescapes.com', commission_rate: 15.00, status: 'active' }
        ]);
        console.log('Agents seeded.');

        // Employees
        await Employee.bulkCreate([
            { employee_code: 'EMP001', name: 'John Doe', dob: '1990-01-01', designation: 'Captain', department: 'Operations', basic_salary: 5000.00, status: 'active', phone: '1112223333', email: 'john@dutchcrm.com' },
            { employee_code: 'EMP002', name: 'Jane Smith', dob: '1992-05-15', designation: 'Crew', department: 'Operations', basic_salary: 3000.00, status: 'active', phone: '4445556666', email: 'jane@dutchcrm.com' }
        ]);
        console.log('Employees seeded.');

        // Bookings
        await Booking.bulkCreate([
            {
                booking_ref: 'BK-2023-001',
                yacht_id: yachts[0].id,
                package_id: packages[0].id,
                agent_id: agents[0].id,
                customer_name: 'Alice Wonderland',
                customer_phone: '555-0101',
                customer_email: 'alice@example.com',
                booking_date: '2023-12-01',
                booking_time: '16:00',
                number_of_people: 4,
                base_price: 1200.00,
                total_price: 1200.00,
                status: 'confirmed',
                notes: 'Vegetarian meal requested'
            },
            {
                booking_ref: 'BK-2023-002',
                yacht_id: yachts[2].id,
                customer_name: 'Bob Builder',
                customer_phone: '555-0102',
                customer_email: 'bob@example.com',
                booking_date: '2023-12-05',
                booking_time: '10:00',
                number_of_people: 6,
                base_price: 2500.00,
                total_price: 2500.00,
                status: 'pending'
            }
        ]);
        console.log('Bookings seeded.');

        console.log('Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
