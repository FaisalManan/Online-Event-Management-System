const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { isLoggedIn, isAdmin, isOrganizerOrAdmin } = require('../middleware/index');

// GET /registrations
// Admin  → all registrations (paginated)
// Organizer → only registrations for their events (paginated)
// Participant → only their own registrations (paginated)
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const LIMIT = 8;
        const currentPage = parseInt(req.query.page) || 1;
        let filter = {};

        if (req.user.role === 'Participant') {
            filter = { participant: req.user._id };
        } else if (req.user.role === 'Organizer') {
            const myEvents = await Event.find({ organizer: req.user._id }, '_id');
            filter = { event: { $in: myEvents.map(e => e._id) } };
        }

        const total = await Registration.countDocuments(filter);
        const totalPages = Math.ceil(total / LIMIT);

        const registrations = await Registration.find(filter)
            .populate('participant', 'username email')
            .populate('event', 'eventName eventDate venue')
            .sort({ registrationDate: -1 })
            .skip((currentPage - 1) * LIMIT)
            .limit(LIMIT);

        res.render('registrations/index', { title: 'Registrations', registrations, currentPage, totalPages, limit: LIMIT });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not load registrations.');
        res.redirect('/dashboard');
    }
});

// GET /registrations/new – Organizer & Admin only
router.get('/new', isLoggedIn, isOrganizerOrAdmin, async (req, res) => {
    try {
        // Only Participants can be registered for events
        const users = await User.find({ role: 'Participant' }, 'username');
        const eventFilter = req.user.role === 'Organizer' ? { organizer: req.user._id } : {};
        const events = await Event.find(eventFilter, 'eventName eventDate');
        res.render('registrations/new', { title: 'Add Registration', users, events, errors: [] });
    } catch (err) {
        req.flash('error', 'Could not load form.');
        res.redirect('/registrations');
    }
});

// POST /registrations
// Participant → can only self-register (via Quick Register button on EventDetails)
// Organizer  → can register any user for their own events
// Admin      → can register anyone for any event
router.post('/', isLoggedIn, async (req, res) => {
    const { participant, event, status } = req.body;

    // Participant: enforce self-registration only
    if (req.user.role === 'Participant') {
        if (participant !== req.user._id.toString()) {
            req.flash('error', 'You can only register yourself for an event.');
            return res.redirect(`/events/${event}`);
        }
        try {
            await Registration.create({ participant, event, status: 'Pending' });
            req.flash('success', 'You have been registered for this event!');
            return res.redirect(`/events/${event}`);
        } catch (err) {
            console.error(err);
            if (err.code === 11000) {
                req.flash('error', 'You are already registered for this event.');
            } else {
                req.flash('error', 'Could not complete registration: ' + err.message);
            }
            return res.redirect(`/events/${event}`);
        }
    }

    // Organizer & Admin path
    const errors = [];
    if (!participant) errors.push('Participant is required.');
    if (!event) errors.push('Event is required.');

    if (errors.length > 0) {
        const users = await User.find({ role: 'Participant' }, 'username');
        const eventFilter = req.user.role === 'Organizer' ? { organizer: req.user._id } : {};
        const events = await Event.find(eventFilter, 'eventName eventDate');
        return res.render('registrations/new', { title: 'Add Registration', users, events, errors });
    }

    try {
        // Organizer can only add registrations to their own events
        if (req.user.role === 'Organizer') {
            const targetEvent = await Event.findById(event);
            if (!targetEvent || targetEvent.organizer.toString() !== req.user._id.toString()) {
                req.flash('error', 'You can only add registrations to your own events.');
                return res.redirect('/registrations/new');
            }
        }

        await Registration.create({ participant, event, status: status || 'Pending' });
        req.flash('success', 'Registration saved successfully!');
        res.redirect('/registrations');
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            req.flash('error', 'This participant is already registered for that event.');
        } else {
            req.flash('error', 'Could not save registration: ' + err.message);
        }
        res.redirect('/registrations/new');
    }
});

// GET /registrations/:id/edit – Organizer (own events) & Admin only
router.get('/:id/edit', isLoggedIn, isOrganizerOrAdmin, async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id).populate('event');
        if (!registration) {
            req.flash('error', 'Registration not found.');
            return res.redirect('/registrations');
        }

        if (req.user.role === 'Organizer' &&
            registration.event.organizer.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only edit registrations for your own events.');
            return res.redirect('/registrations');
        }

        const users = await User.find({ role: 'Participant' }, 'username');
        const eventFilter = req.user.role === 'Organizer' ? { organizer: req.user._id } : {};
        const events = await Event.find(eventFilter, 'eventName eventDate');
        res.render('registrations/edit', { title: 'Edit Registration', registration, users, events, errors: [] });
    } catch (err) {
        console.error(err);
        res.redirect('/registrations');
    }
});

// PUT /registrations/:id – Organizer (own events) & Admin only
router.put('/:id', isLoggedIn, isOrganizerOrAdmin, async (req, res) => {
    const { participant, event, status } = req.body;
    const errors = [];

    if (!participant) errors.push('Participant is required.');
    if (!event) errors.push('Event is required.');

    try {
        const registration = await Registration.findById(req.params.id).populate('event');
        if (!registration) {
            req.flash('error', 'Registration not found.');
            return res.redirect('/registrations');
        }

        if (req.user.role === 'Organizer' &&
            registration.event.organizer.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only edit registrations for your own events.');
            return res.redirect('/registrations');
        }

        if (errors.length > 0) {
            const users = await User.find({ role: 'Participant' }, 'username');
            const eventFilter = req.user.role === 'Organizer' ? { organizer: req.user._id } : {};
            const events = await Event.find(eventFilter, 'eventName eventDate');
            return res.render('registrations/edit', { title: 'Edit Registration', registration, users, events, errors });
        }

        await Registration.findByIdAndUpdate(req.params.id, { participant, event, status });
        req.flash('success', 'Registration updated successfully!');
        res.redirect('/registrations');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not update registration.');
        res.redirect('/registrations');
    }
});

// DELETE /registrations/:id – Admin deletes any; Organizer deletes for own events; Participant cancels own
router.delete('/:id', isLoggedIn, async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id).populate('event');
        if (!registration) {
            req.flash('error', 'Registration not found.');
            return res.redirect('/registrations');
        }

        // Participant: can only cancel their own
        if (req.user.role === 'Participant') {
            if (registration.participant.toString() !== req.user._id.toString()) {
                req.flash('error', 'You can only cancel your own registrations.');
                return res.redirect('/registrations');
            }
            await registration.deleteOne();  // #24 – single delete, no redundancy
            req.flash('success', 'Your registration has been cancelled.');
            return res.redirect('/registrations');
        }

        // #7 – Organizer: can delete registrations for their own events
        if (req.user.role === 'Organizer') {
            if (!registration.event || registration.event.organizer.toString() !== req.user._id.toString()) {
                req.flash('error', 'You can only manage registrations for your own events.');
                return res.redirect('/registrations');
            }
            await registration.deleteOne();
            req.flash('success', 'Registration deleted.');
            return res.redirect('/registrations');
        }

        // Admin: delete any
        if (req.user.role !== 'Admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/registrations');
        }

        await registration.deleteOne();  // #24 – single delete
        req.flash('success', 'Registration deleted.');
        res.redirect('/registrations');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not delete registration.');
        res.redirect('/registrations');
    }
});

module.exports = router;
