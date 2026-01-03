/**
 * Script simple pour réparer le mot de passe admin
 * 
 * Usage: node fix-admin.js
 * 
 * Le script va demander l'email et le nouveau mot de passe
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/projetsemestre';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixAdminPassword() {
  try {
    console.log('[INFO] Script de reparation du mot de passe admin\n');
    
    // Connexion à MongoDB
    console.log('Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[OK] Connexion réussie\n');

    // Demander l'email
    const email = await question('Email de l\'admin: ');
    if (!email) {
      console.error('[ERREUR] Email requis');
      process.exit(1);
    }

    // Trouver l'admin
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      console.error(`[ERREUR] Aucun administrateur trouve avec l'email: ${email}`);
      process.exit(1);
    }

    console.log(`[OK] Administrateur trouve: ${admin.username} (${admin.email})\n`);

    // Demander le nouveau mot de passe
    const password = await question('Nouveau mot de passe: ');
    if (!password || password.length < 6) {
      console.error('[ERREUR] Le mot de passe doit contenir au moins 6 caractères');
      process.exit(1);
    }

    // Hasher le mot de passe
    console.log('\nHashage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Mettre à jour
    admin.password = hashedPassword;
    await admin.save();

    console.log('\n[OK] Mot de passe mis a jour avec succes !');
    console.log(`[OK] Vous pouvez maintenant vous connecter avec:`);
    console.log(`  Email: ${email}`);
    console.log(`  Mot de passe: ${password}\n`);

    process.exit(0);
  } catch (error) {
    console.error('[ERREUR] Erreur:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
  }
}

fixAdminPassword();

