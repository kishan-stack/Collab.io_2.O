import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const internshipSchema = new Schema({
    companyName:{
        type:String,
    },
    companyLogo:{
        type:String,
    },
    designation:{
        type:String,
    },
    jobDescription:{
        type:String,
    },
    jobLocation:{
        type:String,
    },
    skills: [
        {
            type: String
        },
    ]
},{
    timestamps:true
})

internshipSchema.plugin(mongooseAggregatePaginate);
export const Internship = mongoose.model("Internship",internshipSchema)
