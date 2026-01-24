import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email : { 
        type: String,
        unique : true,
        required:true,
        lowercase: true,
        trim: true
    },
    password: {type : String,
        required:true,
        select: false
    },
    refreshToken: String,
    resetToken : String,
    resetExpires: Date
},{
    timestamps:true
});

export const User = mongoose.model("User", userSchema);