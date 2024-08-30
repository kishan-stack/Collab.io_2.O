import { Router } from "express"
import { registerUser } from "../controllers/user.controller.js";
import { verifyEmail } from "../controllers/user.controller.js";
const router = Router();

router.route("/register").post(registerUser)
router.route("/verify/:token").get(verifyEmail)



export default router;