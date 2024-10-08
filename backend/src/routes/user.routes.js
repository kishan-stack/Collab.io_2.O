import { Router } from "express"
import { loginUser, registerUser, verifyEmail, logoutUser, saveAdditionalDetails, testingSaveProfile, getUserDetails,forgotPassword, resetPassword, getAllUsersForSearch} from "../controllers/user.controller.js";
import { verifyUser } from "../middlewares/verifyUser.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { checkProfileCompletion } from "../middlewares/profile.middleware.js";
const router = Router();

router.route("/register").post(registerUser)
router.route("/verify/:token").get(verifyEmail)
router.route("/login").post(loginUser)
router.route("/forgot-password").post(forgotPassword)
router.route("/reset-password/:token").post(resetPassword)

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/getUser").get(verifyJWT, getUserDetails)
router.route("/search-user").post(verifyJWT, verifyUser,checkProfileCompletion,getAllUsersForSearch)
router.route("/testing-saveProfile").post(verifyJWT, verifyUser, checkProfileCompletion, testingSaveProfile)
// first protected route to be redirected for every operation
router.route("/update-me").patch(
    verifyJWT,
    verifyUser,
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    saveAdditionalDetails
)





export default router;