import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { generateAndSendVerificationEmail } from "../utils/generateVerificationTokenAndSendEmail.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get login detail from user
    // put validation
    // check if user already exist
    // hash password
    // create user and send response
    const { fullName, username, email, password } = req.body;
    // console.log(fullName,username,email,password);
    

    if (
        [fullName, email, username, password].some((feild) => feild.trim() === "")
    ) {
        throw new ApiError(400, "All feilds are required")
    }

    // console.log(`allfeilds ok`)

    
        const existingUser = await User.findOne(
            { $or: [{ email }, { username }] },
        )


        if (existingUser) {
            if (existingUser.verified) {
                // User exists and is verified
                throw new ApiError(500, "User already exists. Please log in.");
            } else {
                const { token, verificationExpiry } = await generateAndSendVerificationEmail(email);
                console.log(token,verificationExpiry);
                existingUser.verificationToken = token;
                existingUser.verificationExpiry = verificationExpiry; // Set the token expiry
                await existingUser.save(); 

                return res.status(200).json(
                    new ApiResponse(200, "Your email was registered but not verified , A new verification email has been sent. Please check your inbox.")
                );
            }
        }

        const instanceUser = new User({
            fullName,
            email,
            username: username.toLowerCase(),
            password,
            avatar: "default_avatar_url", // Provide a default or actual avatar URL
            coverImage: "default_cover_image_url", // Provide a default or actual cover image URL
            skills: [],
            portfolio: "default_portfolio_link", // Default value
            githubProfile: "",
            contactNumber:null // Default value, can be updated later
        });

        const user = await instanceUser.save();
        if (!user) {
            throw new ApiError(500, "Error while registering the user ")
        }

        const { token, verificationExpiry } = await generateAndSendVerificationEmail(email);
        console.log(token,verificationExpiry);
        instanceUser.verificationToken = token;
        instanceUser.verificationExpiry = verificationExpiry; // Set the token expiry
        await instanceUser.save()


        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Registration successful! Please check your email for verification."
                )
            );
    

})

const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    
        const user = await User.findOne({ verificationToken: token , verificationExpiry : {
            $gt: Date.now(),
        }});
        if (!user) {
            throw new ApiError(400, "User verificaiton token is invalid or expired");
        }

    
        // If token is valid and not expired, verify the user
        user.isVerified = true;
        user.verificationToken = undefined; // Clear the token
        user.verificationExpiry = undefined; // Clear the expiry
        await user.save({ new: true , validateModifiedOnly: true});
        return res.status(200).json(
            new ApiResponse(
                200,
                "Email verified successfully, User can now login into the platform"
            )
        )


    
})

const loginUser = asyncHandler(async (req, res) => {
    // reqUser => data
    // check for validation
    // check if user exist
    // check password
    // login user
    // set cookie and jwt

    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })



    if (!user) {
        throw new ApiError(404, "User doesn't exist please register  ")
    }

    if (!user.isVerified) {
        throw new ApiError(401, "Please verify your email before logging into the platform");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id)
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60)

    }
    if (!user.profileCompleted) {
        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
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
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken: accessToken,
                    refreshToken: refreshToken,

                },
                "User logged in successfully ! Enjoy the platform!"

            )
        )


})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        )
})

const saveAdditionalDetails = asyncHandler(async (req, res,) => {
    const userId = req.user.id; // Get the user ID from the authenticated user

    const { description, portfolio, githubProfile, contactNumber, skills } = req.body;
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
        throw new ApiError(400, "Students are required to have at least one skill, maybe start with HTML!!");
    }

    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image  file is required");
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(500, "Error while uploading avatar, try again later");
    }
    if (!coverImage) {
        throw new ApiError(500, "Error while uploading cover image, try again later");
    }

    // Update the User document
    const additionalDetailsUpdate = await User.findByIdAndUpdate(userId, {
        $set: {
            description,
            avatar: avatar.secure_url,
            coverImage: coverImage.secure_url,
            portfolio,
            githubProfile,
            contactNumber,
            profileCompleted: true,
        },
        $addToSet:{
            skills: { $each: skills }
        }
    },
        {
            new: true,
            validateModifiedOnly: true
        }).select("-password -refreshToken");

    if (!additionalDetailsUpdate) {
        throw new ApiError(500, "Error while updating User details, try again later");
    }

    return res.status(200)
        .json(new ApiResponse(200, additionalDetailsUpdate, "User profile updated and Contact details saved successfully"));
})

const testingSaveProfile = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(
            new ApiResponse(200, "user test for profile check passed successfully! user can now access protected routes !!   ")
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

const forgotPassword = asyncHandler(async (req,res)=>{
    const  {email} = req.body;
    if (!email) {
        throw new ApiError(401,"User email is not provided")
    }
    const userDoc = await User.findOne({ email: email}).select("-password -refreshToken");
    if (!userDoc) {
        throw new ApiError(404, "User not found");
    }
    try {
        const resetPasswordToken = userDoc.generatePasswordResetTokenForSendingUserEmail();
        const passwordResetExpires = new Date(Date.now() + 600000);
        userDoc.passwordResetToken = resetPasswordToken;
        userDoc.passpasswordResetExpires = passwordResetExpires;
        await userDoc.save();
        const passwordResetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetPasswordToken}`;
        const htmlContent = `<p>Please click this link to change your password: <a href="${passwordResetUrl}">Verify Email</a></p>`;
    
        await sendEmail(email, "Email Verification", htmlContent);
        return res.status(200)
        .json(
            new ApiResponse(200, "Password reset email successfully sent to user ")
        )       
    } catch (error) {
        throw new ApiError(500,"Error while sending password reset email to user!, Try again later")
    }


})

const resetPassword = asyncHandler(async (req,res)=>{
    const resetToken = req.params.token;
    if (!resetToken) {
        throw new ApiError(400,"Invalid Token for reset password ")
    }
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const userDoc = await User.findOne({ 
        passwordResetToken: hashedToken, 
        passwordResetExpires: { $gt: Date.now() }
    }).select("-password -refreshToken");
    if (!userDoc) {
        throw new ApiError(400, "Invalid or expired password reset token");
    }



    userDoc.password = req.body.password;
    userDoc.passwordConfirm = req.body.passwordConfirm;
    userDoc.passwordResetToken = undefined;
    userDoc.passwordResetExpires = undefined;
    await userDoc.save({ new: true ,validateBeforeSave: false});
    const htmlContent = `<p> Hey ${userDoc.username}, Password for your account is changed successfully, if u didn't initiate this please report to our support</p`

    await sendEmail(userDoc.email, "Password reset alert", htmlContent);
    
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userDoc._id);
    const loggedInUser = await User.findById(userDoc._id)
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60)

    }
    if (!userDoc.profileCompleted) {
        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                        redirectTo: '/users/profile'
                    },
                    "User password is successfully! but  profile is not completed , do it to use platform effectively"


                )
            )

    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken: accessToken,
                    refreshToken: refreshToken,

                },
                "User password reset is successfull ! Enjoy the platform!"

            )
        )

    
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    // get incoming token
    // decode it
    // verify it with users token in database
    // if valid , return new access and refresh token

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorized Request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(404,"Invalid refresh token");
        }
        if (incomingRefreshToken!=user?.refreshToken) {
            throw new ApiError(400," Refresh token invalid or used");
        }

        const options = {
            httpOnly:true,
            secure:true,
        }
        const { accessToken,refreshToken } = await generateAccessAndRefreshToken(user._id);
        return res.status(200)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken
                },
                "Access token refreshed successfully"
            )
        )

    } catch (error) {
        throw new ApiError(500,"something went wrong while refreshing your access token !")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const { oldPassword,newPassword} = req.body;
    if (!(oldPassword||newPassword)) {
        throw new ApiError(400,"both the feilds are required");

    }
    try {
        const user = await User.findById(req.user._id);
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
        if (!isPasswordCorrect) {
            throw  new ApiError(400,"old password is incorrect");
        }
        user.password = newPassword;
        await user.save({ validateBeforeSave: false});

        return res.status(200)
        .json(
            new ApiResponse(200,"Users password changed successfully!! ")
        )
    } catch (error) {
        throw new ApiError(500,"Error while changing users password")
    }

})

const updateAccountBasicDetails = asyncHandler(async(req, res) => {
    const {fullName, email, username, description, portfolio,githubProfile,contactNumber,skills } = req.body;

    if (!fullName || !email || !username||!description||!portfolio||!githubProfile||!contactNumber) {
        throw new ApiError(400, "All fields are required")
    }
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
        throw new ApiError(400, "Students are required to have at least one skill, maybe start with HTML!!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
                description,
                username,

                
            },
            $addToSet: { 
                skills: 
                { 
                    $each: skills
                } 
            },
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

export {
    registerUser,
    verifyEmail,
    loginUser,
    logoutUser,
    saveAdditionalDetails,
    testingSaveProfile,
    getUserDetails,
    forgotPassword,
    resetPassword,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountBasicDetails,
    updateUserAvatar,
    updateUserCoverImage,
} 