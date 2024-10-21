const mongoose = require('mongoose')

const connectToMongoDB = async () => {
    try {
        mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB")
    } catch (error) {
        console.log("Error connecting to Database", error.message);
    }
}

module.exports = connectToMongoDB;