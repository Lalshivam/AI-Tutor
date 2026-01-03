import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import { User } from '../models/user.model' 
import { create } from 'domain';

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
    const {email, password} = req.body;

    //check for prior existence of user
    const exists = await User.findOne({email});
    if(exists) return res.status(400).json({error: "User already exist"});

    const hashed = await bcrypt.hash(
        password,      //string
        10                //salt
    );

    await User.create({email, password: hashed});   //create this user in db

    res.json({message :  "Registered successfully"});
}

export async function login(req : any, res : any){
    const { email, password } = req.body;

    const user = await User.findOne({email});
    if(!user) return res.status(400).json({error : "Invalid Credentials"});

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
            path : "/auth/refresh"
        });

    res.json({accessToken});
}

export async function refresh(req : any, res : any) {
    //fetch token from cookie
    const token = req.cookie.refreshToken;
    if(!token) return res.status(401).json({error:"No refresh token"});

    try{
        const decoded : any = jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET!
        );

        const user = await User.findById(decoded.id);

        if(!user || user.refreshToken !== token){
            return res.status(401).json({error : "Invalid refresh token"});
        }

        const accessToken = createAccessToken(user._id.toString());
        res.json({ accessToken });

    }catch{
        res.status(401).json({error:"Invalid refresh token"});
    }
}

export function logout(req : any,res : any){
    res.clearCookie("refreshToken");
    res.json({message : "Logged Out"});
};


