const mongoose = require('mongoose');

const dbConnect =  () => {
    try {
        // Connect to MongoDB
         mongoose.connect(process.env.MONGODB_URL);

        console.log("Database Connected Successfully");
    } catch (error) {
        console.error("Database error:", error);
    }
};

module.exports = dbConnect;

