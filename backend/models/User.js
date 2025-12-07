const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: { 
        type: String,
        enum: ['student', 'teacher', 'admin'], 
        required: true
    },
    // Champs spécifiques pour les étudiants
    studentInfo: {
        firstName: String,
        lastName: String,
        dateOfBirth: Date,
        phone: String,
        address: String,
        filiere: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Filiere'
        },
        enrollmentDate: {
            type: Date,
            default: Date.now
        },
        studentNumber: String
    },
    // Champs spécifiques pour les professeurs
    teacherInfo: {
        firstName: String,
        lastName: String,
        phone: String,
        specialization: String,
        hireDate: {
            type: Date,
            default: Date.now
        },
        teacherNumber: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);