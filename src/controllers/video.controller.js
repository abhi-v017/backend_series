import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Video } from '../models/video.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { v2 as cloudinary } from 'cloudinary';

// const getAllVideos = asyncHandler(async(req,res)=>{
//     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
//     return res
//     .status(200)
//     .json(new ApiResponse(200, res.video, "videos fetched successfully"))
// })

const publishAvideo = asyncHandler(async (req, res) => {

    // title and description from user 
    const { title, description } = req.body
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "all feilds are required")
    }
    const existedTitle = Video.findOne(title)
    if (!existedTitle) {
        throw new ApiError(400, "title already exists")
    }
    // thumnail upload to cloudinary
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail) {
        throw new ApiError(400, "thumbnail not found")
    }

    // video upload to cloudinary
    const videoLocalPath = req.files?.video[0]?.path
    if (!videoLocalPath) {
        throw new ApiError(400, "video is required")
    }
    const videofile = await uploadOnCloudinary(videoLocalPath)
    if (!videofile) {
        throw new ApiError(400, "video not found")
    }

    // schema creation 
    const video = await Video.create({
        title,
        description,
        thumbnail: thumbnail.url,
        video: videofile.url,
        duration: videofile.duration
    })
    if (!video) {
        throw new ApiError(400, "error while publishing video")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, video, "video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "video not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, video, "video found successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "video not found")
    }
    const videoCloudinaryUrl = video.video
    const thumbnailCloudinaryUrl = video.thumbnail
    const videoPublicId = videoCloudinaryUrl.split('/').slice(-1)[0].split('.')[0];
    console.log(videoPublicId)
    const thumbnailPublicId = thumbnailCloudinaryUrl.split('/').slice(-1)[0].split('.')[0];
    if (!videoPublicId) {
        throw new ApiError(400, "video not found")
    }
    if (!thumbnailPublicId) {
        throw new ApiError(400, "thumbnail not found")
    }
    await cloudinary.uploader.destroy(videoPublicId, { resource_type: 'video' })
    await cloudinary.uploader.destroy(thumbnailPublicId, { resource_type: 'image' })
    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully!!"))

})
const updateVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description} = req.body
    if (!title || !description) {
        throw new ApiError(400, "values are required")
    }
    //TODO: update video details like title, description, thumbnail

    const updateVideo = Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title:title,
                description:description
            }
        },
        {
            new:true
        }
    )
    return res
    .status(200)
    .json(200, updateVideo, "details updated successfully")
})

export {
    // getAllVideos,
    publishAvideo,
    getVideoById,
    deleteVideo,
    updateVideoDetails
}