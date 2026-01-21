const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password (simple comparison for now, should use bcrypt in production)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ error: 'Account is inactive' });
        }

        // Return user info (excluding password)
        const userWithoutPassword = user.toJSON();
        delete userWithoutPassword.password;

        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout (client-side mostly, but good to have endpoint)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Get current user (mock session for now since we aren't using JWT/Cookies yet)
// In a real app, we'd verify the token here.
// For this MVP, we'll rely on the client storing the user state, 
// but we provide this endpoint for validation if needed.
router.get('/me', async (req, res) => {
    // This is a placeholder. In a real stateless JWT setup, 
    // we would decode the token from headers.
    // Since we are keeping it simple:
    res.status(401).json({ error: 'Not authenticated' });
});

module.exports = router;
