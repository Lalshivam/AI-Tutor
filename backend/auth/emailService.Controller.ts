import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:{
        user : process.env.EMAIL_USER,
        pass : process.env.EMAIL_PASS
    }
});

// for password reset request
export async function requestPasswordReset(req : any , res : any) {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if(!user) return res.json({message : "If email exists, link sent" });

    const token = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    user.resetToken = hashed;
    user.resetExpires = Date.now() + 1000 * 60 * 10;
    await user.save();

    const link = `${process.env.FRONTEND_URL}/reset/${token}`;

    await transporter.sendMail()
}

// func for resetting password
export async function resetPassword(req : any, res : any) {
  const { token } = req.params;
  const { password } = req.body;

  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetToken: hashed,
    resetExpires: { $gt: Date.now() }
  });

  if (!user) return res.status(400).json({ error: "Invalid token" });

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetExpires = undefined;

  await user.save();

  res.json({ message: "Password updated" });
}
