const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const Registration = require('../models/Registration');
const { isLoggedIn, isAdmin, isOrganizerOrAdmin } = require('../middleware/index');

// GET /events – list all events with optional search + pagination (public)
router.get('/', async (req, res) => {
    try {
        const { search, venue, page } = req.query;
        const filter = {};
        const LIMIT = 6;
        const currentPage = parseInt(page) || 1;

        // #4 – escape user input before using in $regex to prevent ReDoS
        const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (search) filter.eventName = { $regex: escapeRegex(search), $options: 'i' };
        if (venue) filter.venue = { $regex: escapeRegex(venue), $options: 'i' };

        const totalEvents = await Event.countDocuments(filter);
        const totalPages = Math.ceil(totalEvents / LIMIT);

        const events = await Event.find(filter)
            .populate('organizer', 'username')
            .sort({ eventDate: 1 })
            .skip((currentPage - 1) * LIMIT)
            .limit(LIMIT);

        res.render('events/EventList', {
            title: 'All Events',
            events,
            search: search || '',
            venue: venue || '',
            currentPage,
            totalPages,
            limit: LIMIT,
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not load events.');
        res.redirect(req.isAuthenticated() ? '/dashboard' : '/events');
    }
});

// GET /events/new – Organizer & Admin only
router.get('/new', isLoggedIn, isOrganizerOrAdmin, async (req, res) => {
    try {
        const organizers = await User.find({ role: { $in: ['Organizer', 'Admin'] } }, 'username');
        res.render('events/AddEvent', { title: 'Add Event', organizers, errors: [] });
    } catch (err) {
        req.flash('error', 'Could not load form.');
        res.redirect('/events');
    }
});

// POST /events – Organizer & Admin only
router.post('/', isLoggedIn, isOrganizerOrAdmin, async (req, res) => {
    const { eventName, eventDate, venue, description, organizer } = req.body;
    const errors = [];

    if (!eventName || !eventName.trim()) errors.push('Event name is required.');
    if (!eventDate) errors.push('Event date is required.');
    if (!venue || !venue.trim()) errors.push('Venue is required.');
    // #12 server-side past-date check
    if (eventDate && new Date(eventDate) < new Date()) errors.push('Event date cannot be in the past.');

    if (errors.length > 0) {
        const organizers = await User.find({ role: { $in: ['Organizer', 'Admin'] } }, 'username');
        return res.render('events/AddEvent', { title: 'Add Event', organizers, errors });
    }

    try {
        await Event.create({
            eventName: eventName.trim(),
            eventDate: new Date(eventDate),
            venue: venue.trim(),
            description: description ? description.trim() : '',
            // Admin can assign any organizer; Organizer is always set as themselves
            organizer: req.user.role === 'Admin' && organizer ? organizer : req.user._id,
        });
        req.flash('success', 'Event created successfully!');
        res.redirect('/events');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not save event.');
        res.redirect('/events/new');
    }
});

// GET /events/:id – public
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'username email');
        if (!event) {
            req.flash('error', 'Event not found.');
            return res.redirect('/events');
        }
        const registrations = await Registration.find({ event: event._id })
            .populate('participant', 'username email');

        // Check if current user is already registered (#2 - duplicate prevention)
        let alreadyRegistered = null;
        if (req.user) {
            alreadyRegistered = await Registration.findOne({
                event: event._id,
                participant: req.user._id,
            });
        }

        res.render('events/EventDetails', { title: event.eventName, event, registrations, alreadyRegistered });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not load event.');
        res.redirect('/events');
    }
});

// GET /events/:id/edit – owner Organizer or Admin only
router.get('/:id/edit', isLoggedIn, isOrganizerOrAdmin, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            req.flash('error', 'Event not found.');
            return res.redirect('/events');
        }

        // Organizer can only edit their own events
        if (req.user.role === 'Organizer' && event.organizer.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only edit your own events.');
            return res.redirect('/events');
        }

        const organizers = await User.find({ role: { $in: ['Organizer', 'Admin'] } }, 'username');
        res.render('events/EditEvent', { title: 'Edit Event', event, organizers, errors: [] });
    } catch (err) {
        console.error(err);
        res.redirect('/events');
    }
});

// PUT /events/:id – owner Organizer or Admin only
router.put('/:id', isLoggedIn, isOrganizerOrAdmin, async (req, res) => {
    const { eventName, eventDate, venue, description, organizer } = req.body;
    const errors = [];

    if (!eventName || !eventName.trim()) errors.push('Event name is required.');
    if (!eventDate) errors.push('Event date is required.');
    if (!venue || !venue.trim()) errors.push('Venue is required.');
    // #12 server-side past-date check
    if (eventDate && new Date(eventDate) < new Date()) errors.push('Event date cannot be in the past.');

    // #6 – validate BEFORE hitting the DB
    if (errors.length > 0) {
        const event = await Event.findById(req.params.id);
        const organizers = await User.find({ role: { $in: ['Organizer', 'Admin'] } }, 'username');
        return res.render('events/EditEvent', { title: 'Edit Event', event, organizers, errors });
    }

    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            req.flash('error', 'Event not found.');
            return res.redirect('/events');
        }

        // Organizer can only update their own events
        if (req.user.role === 'Organizer' && event.organizer.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only edit your own events.');
            return res.redirect('/events');
        }

        await Event.findByIdAndUpdate(req.params.id, {
            eventName: eventName.trim(),
            eventDate: new Date(eventDate),
            venue: venue.trim(),
            description: description ? description.trim() : '',
            // Only Admin can reassign organizer
            ...(req.user.role === 'Admin' && organizer ? { organizer } : {}),
        });

        req.flash('success', 'Event updated successfully!');
        res.redirect(`/events/${req.params.id}`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not update event.');
        res.redirect('/events');
    }
});

// DELETE /events/:id – Admin only
router.delete('/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        await Registration.deleteMany({ event: req.params.id });
        await Event.findByIdAndDelete(req.params.id);
        req.flash('success', 'Event deleted.');
        res.redirect('/events');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not delete event.');
        res.redirect('/events');
    }
});

module.exports = router;
