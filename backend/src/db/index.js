import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { DB } from "../index.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${DB}/${DB_NAME}`);
        // console.log(connectionInstance)
        console.log(
            `✨ MongoDb connected || DB host : ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.log("MONGODB connection failed : ", error);
        process.exit(1);
    }
};

export default connectDB;
