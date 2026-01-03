"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
var bcryptjs_1 = require("bcryptjs");
var jsonwebtoken_1 = require("jsonwebtoken");
var user_model_1 = require("../models/user.model");
var ACCESS_EXPIRY = "15m";
var REFRESH_EXPIRY = "7d";
function createAccessToken(userId) {
    return jsonwebtoken_1.default.sign({ id: userId }, //payload
    process.env.JWT_SECRET, //secret key
    { expiresIn: ACCESS_EXPIRY } //
    );
}
function createRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}
function register(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, email, password, exists, hashed;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = req.body, email = _a.email, password = _a.password;
                    return [4 /*yield*/, user_model_1.User.findOne({ email: email })];
                case 1:
                    exists = _b.sent();
                    if (exists)
                        return [2 /*return*/, res.status(400).json({ error: "User already exist" })];
                    return [4 /*yield*/, bcryptjs_1.default.hash(password, //string
                        10 //salt
                        )];
                case 2:
                    hashed = _b.sent();
                    return [4 /*yield*/, user_model_1.User.create({ email: email, password: hashed })];
                case 3:
                    _b.sent(); //create this user in db
                    res.json({ message: "Registered successfully" });
                    return [2 /*return*/];
            }
        });
    });
}
function login(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, email, password, user, accessToken, refreshToken;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = req.body, email = _a.email, password = _a.password;
                    return [4 /*yield*/, user_model_1.User.findOne({ email: email })];
                case 1:
                    user = _b.sent();
                    if (!user)
                        return [2 /*return*/, res.status(400).json({ error: "Invalid Credentials" })];
                    accessToken = createAccessToken(user._id.toString());
                    refreshToken = createRefreshToken(user._id.toString());
                    return [4 /*yield*/, user_model_1.User.updateOne({ _id: user._id }, { refreshToken: refreshToken })];
                case 2:
                    _b.sent();
                    res.cookie("refreshToken", refreshToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "strict",
                        path: "/auth/refresh"
                    });
                    res.json({ accessToken: accessToken });
                    return [2 /*return*/];
            }
        });
    });
}
function refresh(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var token, decoded, user, accessToken, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = req.cookie.refreshToken;
                    if (!token)
                        return [2 /*return*/, res.status(401).json({ error: "No refresh token" })];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
                    return [4 /*yield*/, user_model_1.User.findById(decoded.id)];
                case 2:
                    user = _b.sent();
                    if (!user || user.refreshToken !== token) {
                        return [2 /*return*/, res.status(401).json({ error: "Invalid refresh token" })];
                    }
                    accessToken = createAccessToken(user._id.toString());
                    res.json({ accessToken: accessToken });
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    res.status(401).json({ error: "Invalid refresh token" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function logout(req, res) {
    res.clearCookie("refreshToken");
    res.json({ message: "Logged Out" });
}
;
