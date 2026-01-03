/**
 * Script pour réparer le mot de passe admin dans la base de données
 * 
 * Usage: node backend/scripts/fixAdminPassword.js <email> <nouveau_mot_de_passe>
 * 
 * Ce script hash le mot de passe de l'admin avec bcrypt pour qu'il puisse se connecter
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/projetsemestre';

async function fixAdminPassword() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('[OK] Connexion à MongoDB réussie');

    // Récupérer les arguments
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.error('[ERREUR] Usage: node fixAdminPassword.js <email> <nouveau_mot_de_passe>');
      process.exit(1);
    }

    const email = args[0];
    const newPassword = args[1];

    // Trouver l'admin par email
    const admin = await User.findOne({ email, role: 'admin' });
    
    if (!admin) {
      console.error(`[ERREUR] Aucun administrateur trouve avec l'email: ${email}`);
      process.exit(1);
    }

    console.log(`[OK] Administrateur trouve: ${admin.username} (${admin.email})`);

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour le mot de passe
    admin.password = hashedPassword;
    await admin.save();

    console.log('[OK] Mot de passe mis à jour avec succès !');
    console.log(`[OK] Vous pouvez maintenant vous connecter avec l'email: ${email}`);
    console.log(`[OK] Mot de passe: ${newPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('[ERREUR] Erreur:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

fixAdminPassword();

