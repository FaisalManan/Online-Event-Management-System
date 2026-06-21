const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
    participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
});

// #2 – Enforce one registration per participant per event at the database level
RegistrationSchema.index({ participant: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', RegistrationSchema);
