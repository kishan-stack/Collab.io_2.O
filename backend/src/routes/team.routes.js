import { Router } from "express"
import { verifyUser } from "../middlewares/verifyUser.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { checkProfileCompletion } from "../middlewares/profile.middleware.js";
import {createTeam ,getTeams, getTeam, updateTeam, deleteTeam } from "../controllers/team.controller.js";

const router = Router();

router.route("/create-team").post(verifyJWT,verifyUser,checkProfileCompletion,createTeam)
router.route("/get-teams").get(verifyJWT,verifyUser,checkProfileCompletion,getTeams)
router.route("/get-team/:teamId").get(verifyJWT,verifyUser,checkProfileCompletion,getTeam)
router.route("/delete-team/:teamId").delete(verifyJWT,verifyUser,checkProfileCompletion,deleteTeam)
router.route("/update-team/:teamId").patch(verifyJWT,verifyUser,checkProfileCompletion,updateTeam)
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