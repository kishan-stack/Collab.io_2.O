import { Router } from "express"
import { verifyUser } from "../middlewares/verifyUser.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { checkProfileCompletion } from "../middlewares/profile.middleware.js";
import { getAllHackathons } from "../controllers/hackathon.controller.js";
const router = Router();

router.route("/search-hackathon").post(verifyJWT,verifyUser,checkProfileCompletion,getAllHackathons)
// first protected route to be redirected for every operation
// router.route("/internshipcreationroute").patch(
//     verifyJWT,
//     verifyUser,
//     upload.fields([
//         {
//             name: "avatar",
//             maxCount: 1
//         },
//         {
//             name: "coverImage",
//             maxCount: 1
//         }
//     ]),
//     saveAdditionalDetails
// )





export default router;