"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
var mongoose_1 = require("mongoose");
var userSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: String,
    refreshToken: String,
    resetToken: String,
    resetExpires: Date
});
exports.User = mongoose_1.default.model("User", userSchema);
