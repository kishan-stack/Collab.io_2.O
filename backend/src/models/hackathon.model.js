import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const hackathonSchema = new Schema({
    name:{
        type:String,
    },
    prizes: [
        {
            level: {
                type: String,
                enum: ['Grand Prize', 'First Runner-up', 'Second Runner-up'], // You can add more levels if needed
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            currency: {
                type: String,
                default: 'INR' // Default currency can be set to INR or any other currency
            }
        }
    ],
    startDate:{
        type:Date,
    },
    endDate:{
        type:Date,
    },
    registrationDeadline:{
        type:Date,
    },
    skills: [
        {
            type: String
        },
    ]
},{
    timestamps: true
})

hackathonSchema.plugin(mongooseAggregatePaginate);
export const Hackathon = mongoose.model("Hackathon",hackathonSchema)
