// require('dotenv').config({path:'./env}) 
import dotenv from "dotenv"
import { DB_NAME } from "./constants.js"
import connectDb from "./db/index.js"
import app from "./app.js"

dotenv.config({
    path: './env'
})

connectDb()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERROR", error)
        throw error
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MongoDb connection failed !!", err)
})
















/* Method 1 to connect DB (Method 2 are from db file means we connect DB in this and then we simply import it in this file)
import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from "express"
const app = express()

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR :", error)
        throw err
    }
})()
    */