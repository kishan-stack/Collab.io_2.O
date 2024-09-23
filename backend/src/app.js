import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan"; //http request logger middleware
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ApiError } from './utils/ApiError.js'; 
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        methods: ["GET", "PATCH", "PUT", "POST", "DELETE"],
        credentials: true,
    })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(helmet());


if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

const limiter = rateLimit({
    max: 3000,
    windowMs: 60 * 60 * 1000, //for one hour
    message: "Too many requests, please try again after an hour",
});

app.use("/tawk", limiter);
app.use(mongoSanitize());
// app.use(xss())


// routes
import userRouter from "./routes/user.routes.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import internshipRouter from "./routes/internship.routes.js"
import hackathonRouter from "./routes/hackathon.routes.js"
import teamRouter from "./routes/team.routes.js"
app.use("/api/v1/users",userRouter);
app.use("/api/v1/internships",internshipRouter);
app.use("/api/v1/hackathons",hackathonRouter);
app.use("/api/v1/teams",teamRouter);

app.use((err,req,res,next) => {
    console.log(err);
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json(
            new ApiResponse(err.statusCode,err.message,err.data|| null,err.success=false)
        );
    }
    
    // next();
    // For unexpected errors
    console.error(err); // Log the error for debugging
    return res.status(500).json({
        message: "An unexpected error occurred. Please try again later.",
        success: false,
    });
});

export { app };
