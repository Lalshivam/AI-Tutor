"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRequired = authRequired;
var jsonwebtoken_1 = require("jsonwebtoken");
function authRequired(req, res, next) {
    var header = req.headers.authorization;
    if (!header)
        return res.status(401).json({ error: "Missing token" });
    var token = header.split(" ")[1];
    try {
        var decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (_a) {
        res.status(401).json({ error: "Invalid token" });
    }
}
