const express = require('express');
const router = express.Router();
const models = require('../models');

// Generic CRUD handler
const createHandler = (Model) => ({
    list: async (req, res) => {
        try {
            const items = await Model.findAll({ order: [['createdAt', 'DESC']] });
            res.json(items);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    create: async (req, res) => {
        try {
            const item = await Model.create(req.body);
            res.json(item);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const [updated] = await Model.update(req.body, {
                where: { id: req.params.id }
            });
            if (updated) {
                const updatedItem = await Model.findByPk(req.params.id);
                res.json(updatedItem);
            } else {
                res.status(404).json({ error: 'Item not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const deleted = await Model.destroy({
                where: { id: req.params.id }
            });
            if (deleted) {
                res.json({ message: 'Item deleted' });
            } else {
                res.status(404).json({ error: 'Item not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    get: async (req, res) => {
        try {
            const item = await Model.findByPk(req.params.id);
            if (item) {
                res.json(item);
            } else {
                res.status(404).json({ error: 'Item not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
});

// Map models to routes
const routeMap = {
    bookings: models.Booking,
    employees: models.Employee,
    yachts: models.Yacht,
    packages: models.Package,
    agents: models.Agent,
    users: models.User
};

Object.entries(routeMap).forEach(([path, Model]) => {
    const handler = createHandler(Model);
    router.get(`/${path}`, handler.list);
    router.post(`/${path}`, handler.create);
    router.get(`/${path}/:id`, handler.get);
    router.put(`/${path}/:id`, handler.update);
    router.delete(`/${path}/:id`, handler.delete);
});

module.exports = router;
