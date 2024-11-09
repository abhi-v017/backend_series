import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
    //get user details from front end ---------done 
    //validation not empty ---------done  
    //validation - {email, username} ----------done
    //check for image, check for avtar ----------done
    //upload on cloudinary ----------done 
    //create user object from db
    //remove refresh token and password from response
    //check for creation of user 
    // return response


    //get user details from front end ---------done 
    const { fullName, username, email, password } = req.body
    console.log('email', email)

    // if(fullName === ''){
    //     throw new ApiError(400, "name is required")
    // }

    //validation not empty ---------done  
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required")
    }

    //validation - {email, username} ----------done
    const existedUser =User.findOne({
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(409, 'user already exist')
    }

    //check for image, check for avtar ----------done
    const avtarLocalPath = req.files?.avtar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avtarLocalPath) {
        throw new ApiError(400, 'avtar image is required')
    }

    //upload on cloudinary ----------done 
    const avtar = await uploadOnCloudinary(avtarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avtar) {
        throw new ApiError(400, 'avtar image is required')
    }

    //create user object from db
    const user = User.create({
        fullName,
        avtar: avtar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: username.toLowerCase()
    })

    //remove refresh token and password from response
    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    )

    //check for creation of user 
    if (!createdUser) {
        throw new ApiError(500, 'something went wrong while registering user')
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, 'user registered successfully')
    )

})

export { registerUser }