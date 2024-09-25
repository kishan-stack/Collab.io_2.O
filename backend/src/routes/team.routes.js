import { Router } from "express"
import { verifyUser } from "../middlewares/verifyUser.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { checkProfileCompletion } from "../middlewares/profile.middleware.js";
import {createTeam ,getTeams, getTeam, updateTeam, deleteTeam, addMemberToTeam, removeMember } from "../controllers/team.controller.js";

const router = Router();
router.use(verifyJWT,verifyUser,checkProfileCompletion)
router.route("/create-team").post(createTeam)
router.route("/get-teams").get(getTeams)
router.route("/get-team/:teamId").get(getTeam)
router.route("/delete-team/:teamId").delete(deleteTeam)
router.route("/update-team/:teamId").patch(updateTeam)
router.route("/join-team/:teamId").post(addMemberToTeam)
router.route("/remove-member/:teamId").delete(removeMember)
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