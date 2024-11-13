import { Router } from "express";
import {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateUserDetails, updateCoverImage, updateAvtar} from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import {verifyJwt} from "../middlewares/auth.middleware.js"

const router = Router()
router.route('/register').post(
    upload.fields([
        {
            name: "avtar",
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser)
router.route('/login').post(loginUser)

//secured routes
router.route('/logout').post(verifyJwt, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(changeCurrentPassword)
router.route('/current-user').post(getCurrentUser)
router.route('/update-details').post(updateUserDetails)
router.route('/update-avtar').post(updateAvtar)
router.route('/update-cover-image').post(updateCoverImage)


export default router