const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    answer: {
        type: mongoose.Schema.Types.Mixed // Peut être une string, un array, etc.
    },
    points: {
        type: Number,
        default: 0
    }
});

const examSubmissionSchema = new mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [answerSchema],
    score: {
        type: Number,
        default: 0
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: 0
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    submittedAt: {
        type: Date
    },
    isSubmitted: {
        type: Boolean,
        default: false
    },
    passed: {
        type: Boolean,
        default: false // Si l'étudiant a réussi (note >= minPassingScore)
    },
    certificateGenerated: {
        type: Boolean,
        default: false
    },
    certificateUrl: {
        type: String
    }
}, {
    timestamps: true
});

// Index pour éviter les doublons
examSubmissionSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('ExamSubmission', examSubmissionSchema);

