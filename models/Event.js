const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Event name cannot exceed 100 characters.'],  // #13
    },
    eventDate: {
        type: Date,
        required: true,
    },
    venue: {
        type: String,
        required: true,
        trim: true,
        maxlength: [150, 'Venue cannot exceed 150 characters.'],       // #13
    },
    description: {
        type: String,
        default: '',
        maxlength: [2000, 'Description cannot exceed 2000 characters.'], // #13
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdDate: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Event', EventSchema);
