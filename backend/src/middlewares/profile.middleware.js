import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const checkProfileCompletion = asyncHandler(async(req,res,next)=>{
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(404, "User not found"); // Changed to 404
        }

        // console.log("User found:", user);

        if (!user.profileCompleted) {
            throw new ApiError(401, "First complete the user profile to access this feature");
            
        }

        next();
    } catch (profileCheckError) {

        // Check if the error is an instance of ApiError
        if (profileCheckError instanceof ApiError) {
            // Propagate the original error
            return next(profileCheckError); // Use next to pass the error to the error handling middleware
        }

        // For unexpected errors, throw a generic error
        return next(new ApiError(500, "Error while checking for profile completion"));
    }
})