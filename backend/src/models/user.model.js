import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { stringify } from "querystring";


const userSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required !"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: [true, "Email is required !"],
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: function (email) {
                    return String(email)
                        .toLowerCase()
                        .match(
                            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                        );
                },
                message: (props) =>
                    `Email (${props.value}) is invalid , use something different!`,
            },
        },
        password: {
            type: String,
            required: [true, "Password is required !"],
        },
        passwordConfirm: {
            type: String,
        },
        passwordChangedAt: {
            type: Date,
        },
        passwordResetToken: {
            type: String,
        },
        passwordResetExpires: {
            type: Date,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
        },
        verificationExpiry: {
            type: Date,
        },
        fullName: {
            type: String,
            required: [true, "Fullname is required !"],
        },
        description: {
            type: String,
        },
        portfolio: {
            type: String,
        },
        githubProfile: {
            type: String,
            
            validate: {
                validator: function (v) {
                    return v === "" || /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+$/.test(
                        v
                    ); // GitHub URL validation
                },
                message: (props) =>
                    `${props.value} is not a valid GitHub profile URL!`,
            },
            default:""
        },
        contactNumber: {
            type: Number,
            validate: {
                validator: function (v) {
                    return v === null ||/^\d{10}$/.test(v); // Example for a 10-digit number
                },
                message: (props) =>
                    `${props.value} is not a valid contact number!`,
            },
            default:null
        },
        avatar: {
            type: String, //cloudinary
            required: true,
        },
        coverImage: {
            type: String,
            required: true,
        },
        profileCompleted: {
            type: Boolean,
            default: false, // Initially set to false
        },
        teams: [
            {
                type: Schema.Types.ObjectId,
                ref: "Team",
            },
        ],
        skills: [
            {
                type: String
            },
        ],
        refreshToken: {
            type: String,
        },
        socket_id: {
            type: String,
        },

    },
    {
        timestamps: true,
    }
);

userSchema.plugin(mongooseAggregatePaginate);
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next()
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }

    )
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
      const changedTimeStamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );
      return JWTTimeStamp < changedTimeStamp;
    }
  
    // FALSE MEANS NOT CHANGED
    return false;
};

userSchema.methods.generatePasswordResetTokenForSendingUserEmail = async function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    return resetToken;

}
export const User = mongoose.model("User", userSchema);
