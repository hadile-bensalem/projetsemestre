const mongoose = require('mongoose');

const filiereSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    description: {
        type: String
    },
    duration: {
        type: Number, // Durée en années
        required: true
    },
    coordinator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Filiere', filiereSchema);
