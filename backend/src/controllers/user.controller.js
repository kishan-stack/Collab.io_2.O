import { asyncHandler,asyncHandler2 } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { sendEmail } from "../utils/emailUtility.js";
import crypto from "crypto"
import { Skill } from "../models/skill.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {Contact} from "../models/contact.model.js" 
const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false});

        return {accessToken,refreshToken}


    } catch (error) {  
        throw new ApiError(500,"Something went wrong");
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    // get login detail from user
    // put validation
    // check if user already exist
    // hash password
    // create user and send response
    const { fullName,username,email,password } = req.body;
    // console.log(fullName,username,email,password);
    
    if (
        [fullName,email,username,password].some((feild)=>feild.trim()==="")
    ) {
        throw new ApiError(400,"All feilds are required")
    }

    // console.log(`allfeilds ok`)

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
      
        const user = await instanceUser.save();
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
        throw new ApiError(500,"User alreasdy exist, try some different mail address instead for sigining up to your account",error)
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
        throw new ApiError(500,"verification token is invalid ",error)
    }
})

const loginUser = asyncHandler(async (req,res)=>{
    // reqUser => data
    // check for validation
    // check if user exist
    // check password
    // login user
    // set cookie and jwt

    const { username, email , password } = req.body;

    if (!username&&!email) {
        throw new ApiError(400,"Username or email is required")
    }

    const user = await User.findOne({
        $or: [ { username }, { email}]  
    })


    
    if (!user) {
        throw new ApiError(404,"User doesn't exist please register  ")
    }

    if (!user.isVerified) {
        throw new ApiError(401, "Please verify your email before logging into the platform");
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401,"Invalid user credentials");
    }
    
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id)
    const cookieOptions = { 
        httpOnly: true,
        secure:true,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60)
        
    }
    if (!user.profileCompleted) {
        return res
        .status(200)
        .cookie("accessToken",accessToken,cookieOptions)
        .cookie("refreshToken",refreshToken,cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    redirectTo: '/users/profile'
                },
                "User logged in successfully! but  profile is not completed , do it to use platform effectively"


            )
        )

    }
    return res
        .status(200)
        .cookie("accessToken",accessToken,cookieOptions)
        .cookie("refreshToken",refreshToken,cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    
                },
                "User logged in successfully"

            )
        )


})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1,
            },
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly: true,
        secure:true,
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out successfully"
        )
    )
})

const saveAdditionalDetails = asyncHandler(async (req,res)=>{
    const userId = req.user.id; // Get the user ID from the authenticated user
    
    const { description, portfolio, githubProfile, contactNumber, skills } = req.body;
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
        throw new ApiError(400, "Students are required to have at least one skill, maybe start with HTML!!");
    }
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(500, "Error while uploading avatar, try again later");
    }
    if (!coverImage) {
        throw new ApiError(500, "Error while uploading cover image, try again later");
    }

    // Check for existing skills or create new ones
    const formattedSkills = await Promise.all(
        skills.map(async (skillName) => {
            let skill = await Skill.findOne({ name: skillName });
            if (!skill) {
                skill = await Skill.create({ name: skillName });
            }
            return skill._id; // Return the ObjectId of the skill
        })
    );

    const contactDetails = {
        contactNumber: contactNumber,
        portfolio: portfolio,
        githubProfile: githubProfile,
    };

    // Create a new Contact document
    const contactDetailsToBeSaved = await Contact.create(contactDetails);

    // Update the User document
    const additionalDetailsUpdate = await User.findByIdAndUpdate(userId, {
        $set: {
            description: description,
            avatar: avatar.secure_url,
            coverImage: coverImage.secure_url,
            contactDetails: contactDetailsToBeSaved._id,
            skills: formattedSkills, // Store the ObjectIds of skills
            profileCompleted: true,
        }
    }, { new: true }).select("-password -refreshToken");

    if (!additionalDetailsUpdate) {
        throw new ApiError(500, "Error while updating User details, try again later");
    }

    return res.status(200)
        .json(new ApiResponse(200, additionalDetailsUpdate, "Contact details saved successfully"));
})


const testingSaveProfile = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(
        new ApiResponse(200,"user test for profile check passed successfully! user can now access protected routes !!   ")
    )
})

const getUserDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return res.status(200)
    .json(new ApiResponse(200, user, "User details fetched successfully"));
})

export {
    registerUser, 
    verifyEmail,
    loginUser,
    logoutUser,
    saveAdditionalDetails,
    testingSaveProfile,
    getUserDetails,
} 