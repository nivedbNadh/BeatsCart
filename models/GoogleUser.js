const mongoose = require('mongoose');

const googleUserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    // Add any other fields provided by Google authentication response
}, { timestamps: true });

const GoogleUser = mongoose.model('GoogleUser', googleUserSchema);

module.exports = GoogleUser;
