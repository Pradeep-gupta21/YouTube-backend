import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrror } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessandRefreshtoken = async (userId) => {
    const user = await User.findById(userId)
    const accessToken = await generateAccesToken()
    const refreshToken = await generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
}


const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //check validation - not empty
    //check if user already exists : username, email
    //check for image, check for avatar
    //upload them to cloudinary, avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation 
    //return res

    const { username, fullName, email, password } = req.body
    // console.log("email :", email)

    if (
        [fullName, username, email, password].some((field) => field?.trim() == "")
    ) {
        throw new ApiErrror(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiErrror(409, "User with email or username is already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiErrror(400, "Avatar file is required on localpath")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiErrror(400, "Avatar file is required on cloudinary")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiErrror(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //req body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const { username, email, password } = req.body

    if (!username || !email) {
        throw new ApiErrror(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiErrror(400, "User is not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiErrror(400, "Incorrect password")
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshtoken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
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
                "User logged In successfully"
            )
        )

})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true
        }
    )
})

const options = {
    httpOnly: true,
    secure: true
}

return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User loggedOut")
    )


export { registerUser, loginUser, logOutUser }