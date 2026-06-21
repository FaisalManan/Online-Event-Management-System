const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
    // 'username' and 'password' are added automatically by passport-local-mongoose
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address.'],
    },
    role: {
        type: String,
        enum: ['Admin', 'Organizer', 'Participant'],
        default: 'Participant',
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
});

// Adds username, hash, salt fields + authenticate, serialize, deserialize methods
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
