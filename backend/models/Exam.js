const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'text'],
        default: 'multiple_choice'
    },
    options: [{
        text: String,
        isCorrect: Boolean
    }],
    points: {
        type: Number,
        default: 1
    },
    correctAnswer: {
        type: String // Pour les questions text ou true_false
    }
});

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filiere: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Filiere',
        required: true
    },
    questions: [questionSchema],
    duration: {
        type: Number, // Durée en minutes
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    minPassingScore: {
        type: Number,
        default: 50, // Note minimale en pourcentage pour réussir
        min: 0,
        max: 100
    },
    availabilityDate: {
        type: Date,
        required: true // Date à partir de laquelle l'examen est disponible
    }
}, {
    timestamps: true
});

// Calculer le total des points avant de sauvegarder
examSchema.pre('save', function(next) {
    if (this.questions && this.questions.length > 0) {
        this.totalPoints = this.questions.reduce((total, q) => total + (q.points || 1), 0);
    }
    next();
});

module.exports = mongoose.model('Exam', examSchema);

