import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan"; //http request logger middleware
import rateLimit from "express-rate-limit";
import helmet from "helmet";
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

app.use("/api/v1/users",userRouter)

export { app };
