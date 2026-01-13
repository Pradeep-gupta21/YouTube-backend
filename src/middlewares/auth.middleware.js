import { User } from "../models/user.models.js";
import { ApiErrror } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(req, _ , next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorisation")?.replace("Bearer ","")
    
        if(!token){
            throw new ApiErrror(401, "Unauthorised Access")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user =await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiErrror(401,"Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiErrror(401, error?.message || "Invalid Access Token")
    }
}) 