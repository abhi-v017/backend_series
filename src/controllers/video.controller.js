import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Video } from '../models/video.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { v2 as cloudinary } from 'cloudinary';

const getAllVideos = asyncHandler(async(req,res)=>{
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    // Build the query object
    const queryObject = {};
    if (userId) {
        queryObject.userId = userId; // Filter by userId if provided
    }
    if (query) {
        queryObject.title = { $regex: query, $options: 'i' }; // Search by title if query is provided
    }

    // Fetch videos with pagination and sorting
    const videos = await Video.find(queryObject)
        .sort({ [sortBy]: sortType === 'asc' ? 1 : -1 }) // Sort by the specified field
        .skip((pageNumber - 1) * limitNumber) // Skip the records for pagination
        .limit(limitNumber); // Limit the number of records returned

    // Get the total count of videos for pagination
    const totalVideos = await Video.countDocuments(queryObject);

    // Return the response
    return res.status(200).json(new ApiResponse(200, {
        videos,
        totalPages: Math.ceil(totalVideos / limitNumber),
        currentPage: pageNumber,
        totalVideos
    }, "Videos fetched successfully"));
})

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
    const { videoId } = req.params;
    const { title, description} = req.body;

    // Check if at least one field is provided
    if (!title && !description && !thumbnail) {
        throw new ApiError(400, "At least one of title or description is required");
    }
    const thumbnail = req.file?.path
    if (!thumbnail) {
        throw new ApiError(400, " avtar image required")
    }

    // Find the video by ID
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Prepare the update object
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    // Handle thumbnail update if provided
    if (thumbnail) {
        // Thumbnail handling
        const oldThumbnail = video.thumbnail;
        const thumbnailPublicId = oldThumbnail.split('/').slice(-1)[0].split('.')[0];
        if (!thumbnailPublicId) {
            throw new ApiError(400, "Old thumbnail not found");
        }

        // Delete the old thumbnail from Cloudinary
        await cloudinary.uploader.destroy(thumbnailPublicId, { resource_type: 'image' });

        // Upload the new thumbnail
        const newThumbnail = await uploadOnCloudinary(thumbnail);
        updateData.thumbnail = newThumbnail.url; // Add new thumbnail URL to update data
    }

    // Update the video details
    const updatedDetails = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true} // runValidators ensures that the update adheres to the schema
    );

    return res
    .status(200)
    .json(new ApiResponse(200, updatedDetails, "Details updated successfully"));
})
export {
    getAllVideos,
    publishAvideo,
    getVideoById,
    deleteVideo,
    updateVideoDetails
}