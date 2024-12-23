import { Router } from "express";
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { deleteVideo, getAllVideos, getVideoById, publishAvideo, updateVideoDetails } from "../controllers/video.controller.js";

const router = Router();
router.use(verifyJwt);
router.route('/').get(getAllVideos)
router.route('/publish-video').post(
    upload.fields([
        {
            name: 'thumbnail',
            maxCount: 1
        },
        {
            name: 'video',
            maxCount: 1
        }
    ]),
    publishAvideo
)

router.route('/:videoId')
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideoDetails)

export default router