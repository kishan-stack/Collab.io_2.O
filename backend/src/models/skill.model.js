import mongoose, { Schema } from "mongoose";

const skillSchema = new Schema({
    name: {
        type: String,
        required: [true, "Skill name is required!"],
        unique: true, // Ensure skill names are unique
    },
    description: {
        type: String,
    },
},{
    timestamps: true, // Add created and updated timestamps
});

export const Skill = mongoose.model("Skill", skillSchema);