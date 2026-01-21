const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');


app.use(cors());
app.use(express.json());

// Serve .well-known folder for SSL verification
const path = require('path');
app.use('/.well-known', express.static(path.join(__dirname, '../.well-known')));

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('Dutch CRM API is running');
});

// Sync database and start server
sequelize.sync({ force: false }) // Set force: true to drop tables on startup (dev only)
    .then(() => {
        console.log('Database connected');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
