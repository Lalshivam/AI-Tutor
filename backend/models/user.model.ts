import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email : { 
        type: String,
        unique : true,
        required:true
    },
    password: String,
    refreshToken: String,
    resetToken : String,
    resetExpires: Date

});

export const User = mongoose.model("User", userSchema);