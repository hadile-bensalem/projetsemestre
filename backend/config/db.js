const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log(" Connexion ressi");
    } catch (err) {
        console.error("erreur de connexion", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;