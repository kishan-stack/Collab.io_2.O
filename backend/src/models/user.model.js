import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
        verificationExpires: {
            type: Date,
        },
        fullName: {
            type: String,
            required: [true, "Fullname is required !"],
        },
        description: {
            type: String,
        },
        contactDetails: {
            type: Schema.Types.ObjectId,
            ref: "Contact",
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
                type: Schema.Types.ObjectId,
                ref: "Skill",
            },
        ],
        refreshToken: {
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
    this.password = await bcrypt.hash(this.password,10);
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

export const User = mongoose.model("User", userSchema);
