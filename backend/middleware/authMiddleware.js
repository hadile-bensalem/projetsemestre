const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Log pour le débogage
    console.log(`[AUTH] Middleware protect - ${req.method} ${req.path}`);
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            if (!token) {
                console.log('   [ERREUR] Token manquant');
                return res.status(401).json({
                    success: false,
                    message: 'Token manquant'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (!decoded || !decoded.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Token invalide'
                });
            }
            
            req.user = await User.findById(decoded.userId).select('-password');
            
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            if (!req.user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Compte désactivé'
                });
            }

            req.userId = decoded.userId.toString();
            req.userRole = decoded.role;

            console.log(`   [OK] Authentification reussie - UserId: ${req.userId}, Role: ${req.userRole}`);
            next();
        } catch (error) {
            console.error('   [ERREUR] Erreur auth middleware:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Token invalide ou expiré'
            });
        }
    } else {
        console.log('   [ERREUR] Pas de token dans les headers');
        return res.status(401).json({
            success: false,
            message: 'Pas de token, accès refusé'
        });
    }
};

const admin = (req, res, next) => {
    if (req.userRole && req.userRole === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé. Réservé aux administrateurs.'
        });
    }
};

const teacher = (req, res, next) => {
    console.log(`[AUTH] Middleware teacher - Role: ${req.userRole}`);
    if (req.userRole && (req.userRole === 'teacher' || req.userRole === 'admin')) {
        console.log('   [OK] Acces autorise pour enseignant/admin');
        next();
    } else {
        console.log('   [ERREUR] Acces refuse - Role insuffisant');
        return res.status(403).json({
            success: false,
            message: 'Accès refusé. Réservé aux professeurs.'
        });
    }
};

const student = (req, res, next) => {
    if (req.userRole && (req.userRole === 'student' || req.userRole === 'teacher' || req.userRole === 'admin')) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé. Réservé aux étudiants.'
        });
    }
};

const studentOnly = (req, res, next) => {
    if (req.userRole && req.userRole === 'student') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé. Réservé aux étudiants uniquement.'
        });
    }
};

const teacherOnly = (req, res, next) => {
    if (req.userRole && req.userRole === 'teacher') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé. Réservé aux enseignants uniquement.'
        });
    }
};

module.exports = { protect, admin, teacher, student, studentOnly, teacherOnly };