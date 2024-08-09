import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
dotenv.config({ path: "./env" });
import http from "node:http";

const server = http.createServer(app); //upgrading connection for socket io

//edge cases
process.on("uncaughtException", (err) => {
    console.error(err);
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.log(err);
    server.close(() => {
        process.exit(1);
    });
});
// db configuration
export const DB = process.env.MONGODB_URI.replace(
    "<PASSWORD>",
    process.env.MONGODB_PASSWORD
);

//database connection
connectDB()
    .then(() => {
        // app.listen(process.env.PORT || 8000,()=>{
        //     console.log(`✨ Server is running on port : ${process.env.PORT}`)
        // })
        server.listen(process.env.PORT || 8000, () => {
            console.log(`✨ Server is running on port : ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB connection failed with error :: ", err);
    });
