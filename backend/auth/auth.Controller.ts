import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import { User } from '../models/userModel.js' 

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

function createAccessToken(userId : string){
    return jwt.sign(
        {id:userId},                    //payload
        process.env.JWT_SECRET!,        //secret key
        {expiresIn: ACCESS_EXPIRY}      //
    );
}

function createRefreshToken(userId: string){
    return jwt.sign(
        { id:userId }, 
        process.env.JWT_REFRESH_SECRET!,
        {expiresIn : REFRESH_EXPIRY}
    );
}





export async function register(req : any, res : any){
    try {
        const {email, password} = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({message: "Email and password are required"});
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({message: "Invalid email format"});
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }

        //check for prior existence of user
        const exists = await User.findOne({email: email.toLowerCase()});
        if(exists) return res.status(400).json({message: "User already exists"});

        const hashed = await bcrypt.hash(
            password,      //string
            10                //salt
        );

        await User.create({email: email.toLowerCase(), password: hashed});   //create this user in db

        res.json({message :  "Registered successfully"});
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({message: "Server error during registration"});
    }
}

export async function login(req : any, res : any){
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({message: "Email and password are required"});
        }

        const user = await User.findOne({email: email.toLowerCase()}).select("+password");
        if(!user) return res.status(401).json({message : "Invalid credentials"});

        // Compare password with hashed password
        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) return res.status(401).json({message: "Invalid credentials"});

        const accessToken = createAccessToken(user._id.toString());
        const refreshToken = createRefreshToken(user._id.toString());

        await User.updateOne({_id:user._id},{refreshToken});

        res.cookie(
            "refreshToken",
            refreshToken,
            {
                httpOnly:true,
                secure : process.env.NODE_ENV === "production",
                sameSite : "strict",
                path : "/auth/refresh",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

        res.json({accessToken});
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({message: "Server error during login"});
    }
}

export async function refresh(req : any, res : any) {
    //fetch token from cookie
    const token = req.cookies?.refreshToken;
    if(!token) return res.status(401).json({message:"No refresh token"});

    try{
        const decoded : any = jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET!
        );

        const user = await User.findById(decoded.id);

        if(!user || user.refreshToken !== token){
            return res.status(401).json({message : "Invalid refresh token"});
        }

        const accessToken = createAccessToken(user._id.toString());
        res.json({ accessToken });

    }catch{
        res.status(401).json({message:"Invalid refresh token"});
    }
}

export function logout(req : any,res : any){
    res.clearCookie("refreshToken", { path: "/auth/refresh" });
    res.json({message : "Logged Out"});
};


