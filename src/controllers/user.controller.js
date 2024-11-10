import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

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
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(409, 'user already exist')
    }

    //check for image, check for avtar ----------done
    const avtarLocalPath = req.files?.avtar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
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
    const user = await User.create({
        fullName,
        avtar: avtar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
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
const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const { email, username, password } = req.body

    if (!username || !email) {
        throw new ApiError(400, "username or email not found")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, 'user does not exist')
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) {
        throw new ApiError(401, 'invalid user credentials')
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(uesr._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{},"user logged out successfully"))
})

export { registerUser, loginUser, logoutUser }