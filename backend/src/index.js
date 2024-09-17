import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
dotenv.config({ path: "./env" });
import http, { METHODS } from "node:http";
import { Server} from "socket.io";
import { User } from "./models/user.model.js";

const server = http.createServer(app); //upgrading connection for socket io


const io = new Server(server,{
    cors: {
        origin:process.env.CORS_ORIGIN,
        METHODS:["GET","POST"],
    }
})


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
    
io.on("connection",async(socket)=>{
    console.log(socket);
    const userId = socket.handshake.query["user_id"];
    const socket_id = socket.id;
    console.log(`user connected ${socket_id}`);

    if (userId) {
        await User.findByIdAndUpdate(userId,{ socket_id:socket_id})
    }
    socket.on("friend_request",async(data)=>{
        console.log(data);

        const to = await User.findById(data.to).select("-password -refreshToken");
        io.to(to.socket_id).emit("new_friend_request",{
            
        })
    })
    
})   


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

