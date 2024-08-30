import { asyncHandler,asyncHandler2 } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { sendEmail } from "../utils/emailUtility.js";
import crypto from "crypto"


const registerUser = asyncHandler(async (req,res)=>{
    // get login detail from user
    // put validation
    // check if user already exist
    // hash password
    // create user and send response
    const { fullName,username,email,password } = req.body;
    console.log(fullName,username,email,password);
    
    if (
        [fullName,email,username,password].some((feild)=>feild.trim()==="")
    ) {
        throw new ApiError(400,"All feilds are required")
    }

    console.log(`allfeilds ok`)

    try {
        const existingUser = await User.findOne(
            { $or: [{ email }, { username }] },
        )

    
        if (existingUser) {
            throw new ApiError(400,"User already exists")
        }
        
        const verificationToken =  crypto.randomBytes(32).toString("hex");
        const instanceUser = new User({
            fullName,
            email,
            username,
            password,
            verificationToken,
            avatar: "default_avatar_url", // Provide a default or actual avatar URL
            coverImage: "default_cover_image_url", // Provide a default or actual cover image URL
            skills: [],
        });
        console.log(`instance user : ${instanceUser}`)
        console.log("Attempting to save user:", instanceUser); 
        const user = await instanceUser.save();
        console.log(`user saved : ${user}`)
        if (!user) {
            throw new ApiError(500,"Error while registering the user ")
        }
    
        const verificaitonUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
        const htmlContent = `<p>Please verify your email by clicking the link: <a href="${verificaitonUrl}">Verify Email</a></p>`;
    
        await sendEmail(email, "Email Verification", htmlContent);
        
    
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Registration successful! Please check your email for verification."
                )
            );
    } catch (error) {
        throw new ApiError(500,"Server error",error)
    }


})

const verifyEmail = asyncHandler(async (req,res)=>{
    const { token } = req.params;

    try {
        const user = await User.findOne({verificationToken: token});
        if (!user) {
            throw new ApiError(400,"User verificaiton token is invalid");
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                "Email verified successfully"
            )
        )


    } catch (error) {
        throw new ApiError(500,"server error at utility email-verify",error)
    }
})

export { registerUser, verifyEmail } 