import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const teamSchema = new Schema({
    name:{
        type:String,
    },
    leader:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    members:[
        {
            type:Schema.Types.ObjectId,
            ref:"User",
        }
    ],
    teamInviteCode:{
        type:String,
    }
},{
    timestamps: true
})
teamSchema.plugin(mongooseAggregatePaginate)
export const Team = mongoose.model("Team",teamSchema)
