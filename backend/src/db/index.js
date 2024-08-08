import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { DB } from "../index.js";

const DBURL = `${DB}/${DB_NAME}`;
const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(DBURL,{
            useNewUrlParser: true,
            useCreateIndex:true,
            useFindAndModify:false,
            useUnifiedTopology: true,
        })
        // console.log(connectionInstance)
        console.log(`✨ MongoDb connected || DB host : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MONGODB connection failed : ",error);
        process.exit(1);
    }
}

export default connectDB