import connectDB from "./db/index.js";
import dotenv from "dotenv"
import { app } from "./app.js";
dotenv.config({path:'./env'})
import http from 'node:http'


const server = http.createServer(app);//upgrading connection for socket io




connectDB()
.then(() => {
    // app.listen(process.env.PORT || 8000,()=>{
    //     console.log(`✨ Server is running on port : ${process.env.PORT}`)
    // })
    server.listen(process.env.PORT || 8000,()=>{
        console.log(`✨ Server is running on port : ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MongoDB connection failed with error :: ",err)
})