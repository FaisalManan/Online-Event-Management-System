const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { isLoggedIn, isAdmin } = require('../middleware/index');

// GET /users – list all users with optional search by username (Admin only)
router.get('/', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { search } = req.query;
        const filter = {};

        if (search) {
            const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.username = { $regex: escapeRegex(search), $options: 'i' };
        }

        const users = await User.find(filter, 'username email role registrationDate')
            .sort({ registrationDate: -1 });

        res.render('users/index', { title: 'Manage Users', users, search: search || '', errors: [] });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not load users.');
        res.redirect('/dashboard');
    }
});

// POST /users – Admin creates a new user with any role (including Admin)
router.post('/', isLoggedIn, isAdmin, async (req, res) => {
    const { username, email, password, role } = req.body;
    const errors = [];

    if (!username || username.trim().length < 3) errors.push('Username must be at least 3 characters.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required.');
    if (!password || password.length < 8) errors.push('Password must be at least 8 characters.');

    if (errors.length > 0) {
        const users = await User.find({}, 'username email role registrationDate').sort({ registrationDate: -1 });
        return res.render('users/index', { title: 'Manage Users', users, search: '', errors });
    }

    try {
        const allowedRoles = ['Participant', 'Organizer', 'Admin'];
        const assignedRole = allowedRoles.includes(role) ? role : 'Participant';
        const user = new User({ username: username.trim(), email, role: assignedRole });
        await User.register(user, password);
        req.flash('success', `User "${username.trim()}" created successfully as ${assignedRole}.`);
        res.redirect('/users');
    } catch (err) {
        console.error(err);
        const users = await User.find({}, 'username email role registrationDate').sort({ registrationDate: -1 });
        return res.render('users/index', {
            title: 'Manage Users',
            users,
            search: '',
            errors: [err.message],
        });
    }
});

// DELETE /users/:id – delete a user (Admin only, cannot delete self)
router.delete('/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            req.flash('error', 'You cannot delete your own account.');
            return res.redirect('/users');
        }

        const userEvents = await Event.find({ organizer: req.params.id }, '_id');
        const eventIds = userEvents.map(e => e._id);

        await Registration.deleteMany({
            $or: [
                { participant: req.params.id },
                { event: { $in: eventIds } },
            ]
        });
        await Event.deleteMany({ organizer: req.params.id });
        await User.findByIdAndDelete(req.params.id);

        req.flash('success', 'User deleted successfully.');
        res.redirect('/users');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not delete user.');
        res.redirect('/users');
    }
});

module.exports = router;
