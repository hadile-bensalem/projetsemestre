/**
 * Script pour tester les routes et vérifier la cohérence backend-frontend
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
const Filiere = require('../models/Filiere');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/projetsemestre';

async function testDatabase() {
  try {
    console.log('[INFO] Test de coherence Backend-Frontend\n');
    
    // Connexion à MongoDB
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('   [OK] Connexion reussie\n');

    // Vérifier les collections
    console.log('2. Vérification des collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('   Collections trouvées:', collectionNames.join(', '));
    
    // Vérifier si la collection courses existe
    if (collectionNames.includes('courses')) {
      console.log('   [OK] Collection "courses" existe');
      const courseCount = await Course.countDocuments();
      console.log(`   [OK] Nombre de cours: ${courseCount}`);
    } else {
      console.log('   [ATTENTION]  Collection "courses" n\'existe pas encore (sera créée automatiquement)');
    }

    // Vérifier les utilisateurs
    if (collectionNames.includes('users')) {
      console.log('   [OK] Collection "users" existe');
      const userCount = await User.countDocuments();
      const teacherCount = await User.countDocuments({ role: 'teacher' });
      console.log(`   [OK] Nombre d'utilisateurs: ${userCount}`);
      console.log(`   [OK] Nombre d'enseignants: ${teacherCount}`);
    }

    // Vérifier les filières
    if (collectionNames.includes('filieres')) {
      console.log('   [OK] Collection "filieres" existe');
      const filiereCount = await Filiere.countDocuments();
      console.log(`   [OK] Nombre de filieres: ${filiereCount}`);
      
      if (filiereCount === 0) {
        console.log('   [ATTENTION]  Aucune filière trouvée. Créez au moins une filière pour pouvoir créer des cours.');
      }
    }

    console.log('\n3. Test du modèle Course...');
    try {
      // Tester la création d'un document (sans le sauvegarder)
      const testCourse = new Course({
        title: 'Test',
        teacher: new mongoose.Types.ObjectId(),
        filiere: new mongoose.Types.ObjectId(),
        fileUrl: 'http://test.com/test.pdf',
        fileName: 'test.pdf'
      });
      await testCourse.validate();
      console.log('   [OK] Modèle Course valide');
    } catch (error) {
      console.log('   [ERREUR] Erreur dans le modèle Course:', error.message);
    }

    console.log('\n[OK] Verification terminee');
    console.log('\n[INFO] Notes importantes:');
    console.log('   - MongoDB crée automatiquement les collections au premier insert');
    console.log('   - Si vous avez une erreur 404, vérifiez:');
    console.log('     1. Le backend est démarré sur le port 5000');
    console.log('     2. Vous êtes connecté avec un compte enseignant');
    console.log('     3. Le token JWT est valide');
    console.log('     4. L\'URL de l\'API est correcte: http://localhost:5000/api');

    process.exit(0);
  } catch (error) {
    console.error('[ERREUR] Erreur:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

testDatabase();

