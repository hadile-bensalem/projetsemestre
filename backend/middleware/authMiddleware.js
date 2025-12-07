const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
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

            req.userId = decoded.userId;
            req.userRole = decoded.role;

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token invalide ou expiré'
            });
        }
    } else {
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
    if (req.userRole && (req.userRole === 'teacher' || req.userRole === 'admin')) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé. Réservé aux professeurs.'
        });
    }
};

module.exports = { protect, admin, teacher };