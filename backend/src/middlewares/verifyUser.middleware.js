import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const verifyUser = asyncHandler(async (req,res,next)=>{
    const userId = req.user._id;
    try {
        const user = await User.findById(userId).select("-password -refreshToken");
        if (!user || !user.isVerified) {
            return res
                .status(403)
                .json(
                    new ApiResponse(
                        false,
                        "User is not verified. Please verify your email first.",
                        null
                    )
                );
        }
        next();
    } catch (error) {
       throw new ApiError(500,"Server Error",error) ;
    }


})

export { verifyUser }