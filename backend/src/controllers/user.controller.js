import { asyncHandler,asyncHandler2 } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req,res)=>{
     res.status(200)
    .json({
        message:" new message "
    })
})

export { registerUser } 