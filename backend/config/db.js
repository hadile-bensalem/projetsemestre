const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/projetsemestre';
        await mongoose.connect(mongoURI);
        console.log("[OK] Connexion reussie a MongoDB");
    } catch (err) {
        console.error("[ERREUR] Erreur de connexion MongoDB:", err.message);
        console.error("[ATTENTION] Le serveur continue mais les operations de base de donnees echoueront");
        // Ne pas arrêter le serveur pour voir les autres erreurs
    }
};

module.exports = connectDB;