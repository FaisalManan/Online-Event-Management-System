const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const Event = require('../models/Event');           // top-level import
const Registration = require('../models/Registration'); // top-level import
const { isLoggedIn } = require('../middleware/index');

// GET /register
router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Register' });
});

// POST /register
router.post('/register', async (req, res) => {
    const { username, email } = req.body;
    // #1 – Block Admin role from self-registration
    const allowedRoles = ['Participant', 'Organizer'];
    const role = allowedRoles.includes(req.body.role) ? req.body.role : 'Participant';

    // #11 – server-side validation
    const errors = [];
    if (!username || username.trim().length < 3) errors.push('Username must be at least 3 characters.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required.');
    if (!req.body.password || req.body.password.length < 8) errors.push('Password must be at least 8 characters.');

    if (errors.length > 0) {
        errors.forEach(e => req.flash('error', e));
        return res.redirect('/register');
    }

    try {
        const user = new User({ username: username.trim(), email, role });
        await User.register(user, req.body.password);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/register');
    }
});

// GET /login
router.get('/login', (req, res) => {
    res.render('auth/login', { title: 'Login' });
});

// POST /login
router.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true,
}));

// GET /logout
router.get('/logout', isLoggedIn, (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash('success', 'You have been logged out.');
        res.redirect('/login');
    });
});

// GET /dashboard
router.get('/dashboard', isLoggedIn, async (req, res) => {
    try {
        let totalEvents, totalRegistrations, recentEvents;
        const totalUsers = await User.countDocuments();

        if (req.user.role === 'Organizer') {
            totalEvents = await Event.countDocuments({ organizer: req.user._id });
            const myEventIds = (await Event.find({ organizer: req.user._id }, '_id')).map(e => e._id);
            totalRegistrations = await Registration.countDocuments({ event: { $in: myEventIds } });
            recentEvents = await Event.find({ organizer: req.user._id })
                .populate('organizer', 'username')
                .sort({ createdDate: -1 })
                .limit(5);
        } else {
            totalEvents = await Event.countDocuments();
            totalRegistrations = await Registration.countDocuments();
            recentEvents = await Event.find()
                .populate('organizer', 'username')
                .sort({ createdDate: -1 })
                .limit(5);
        }

        res.render('dashboard', {
            title: 'Dashboard',
            totalEvents,
            totalUsers,
            totalRegistrations,
            recentEvents,
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not load dashboard.');
        res.redirect('/events');
    }
});

module.exports = router;
