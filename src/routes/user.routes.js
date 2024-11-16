import { Router } from "express";
import {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateUserDetails, updateCoverImage, updateAvtar, getUserChannelProfile, getWatchHistory} from '../controllers/user.controller.js'
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
router.route('/change-password').post(verifyJwt, changeCurrentPassword)
router.route('/current-user').get(verifyJwt, getCurrentUser)
router.route('/update-details').patch(verifyJwt, updateUserDetails)
router.route('/update-avtar').patch(verifyJwt, upload.single('avtar'), updateAvtar)
router.route('/update-cover-image').patch(verifyJwt, upload.single('coverImage'), updateCoverImage)
router.route('/c/:username').get(verifyJwt, getUserChannelProfile)
router.route('/history').get(verifyJwt, getWatchHistory)


export default router