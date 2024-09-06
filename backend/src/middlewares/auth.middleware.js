import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer  ","");
        if (!token) {
            throw new ApiError(400,"Please log into the platform")
            
        }
        const decodedUser =  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedUser?._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(400,"Invalid Access Token")
        }
        
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401,error.message || "Invalid access Token")   
    }
})