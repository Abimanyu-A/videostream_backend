import {asyncHandler} from "../utils/asyncHandker.js"
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const registerUser = asyncHandler( async(req,res) => {
    // get user details from the frontend
    // validation - not empty
    // check if user already exists
    // check for images, check for avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullname, email, username, password} = req.body
    console.log("email: ",req.body);

    // if(fullname === ""){
    //     throw new ApiError(400, "fullname is required")
    // }

    if (
        [fullname,email,username,password].some((field)=>{
            field?.trim() === ""
        })
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with same email or username exist");
    }
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath)
        throw new ApiError(400,"Avatar is required")

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar)
        throw new ApiError(400,"Avatar is required")

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"error")
    }
    return res.status(200).json({message: "success"});
})

export const loginUser = asyncHandler(async (req,res) => {
    const { email, username, password } = req.body

    if(!email || !username){
        return res.status(400).json({message: "Email or Username is required"});
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        return res.status(404).json({message: "User does not exist"});
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        return res.status(401).json({message: "invalid user credentials"});
    }
    
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false});
    
    const LoggedInUser = await User.findById(user._id).select("-password -refreshToken");
    return res.sta



})

