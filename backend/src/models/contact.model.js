import { Schema } from "mongoose";
import mongoose from "mongoose";

const contactSchema = new Schema(
    {
        portfolio: {
            type: String,
        },
        githubProfile: {
            type: String,
            required: [true, "Github Profile is required!"],
            validate: {
                validator: function (v) {
                    return /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+$/.test(
                        v
                    ); // GitHub URL validation
                },
                message: (props) =>
                    `${props.value} is not a valid GitHub profile URL!`,
            },
        },
        contactNumber: {
            type: Number,
            validate: {
                validator: function (v) {
                    return /^\d{10}$/.test(v); // Example for a 10-digit number
                },
                message: (props) =>
                    `${props.value} is not a valid contact number!`,
            },
        },
    },
    {
        timestamps: true,
    }
);

export const Contact = mongoose.model("Contact", contactSchema);
