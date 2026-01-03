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
var express_1 = require("express");
var cors_1 = require("cors");
var dotenv_1 = require("dotenv");
var path_1 = require("path");
var fs_1 = require("fs");
var url_1 = require("url");
var auth_Controller_1 = require("./auth/auth.Controller");
var auth_Middleware_1 = require("./auth/auth.Middleware");
dotenv_1.default.config(); // load .env early
// ESM-safe __dirname
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var isDev = process.env.NODE_ENV !== 'production';
// dynamic import of TS in dev and JS in production
var solveMathFile = isDev ? 'solveMath.ts' : 'solveMath.js';
var geminiFile = isDev ? 'gemini.ts' : 'gemini.js';
var solveMathUrl = (0, url_1.pathToFileURL)(path_1.default.resolve(__dirname, solveMathFile)).href;
var geminiUrl = (0, url_1.pathToFileURL)(path_1.default.resolve(__dirname, geminiFile)).href;
console.log('BOOT:', { NODE_ENV: process.env.NODE_ENV, isDev: isDev, __dirname: __dirname, solveMathUrl: solveMathUrl, geminiUrl: geminiUrl });
var solveMath = (await Promise.resolve("".concat(solveMathUrl)).then(function (s) { return require(s); })).solveMath;
var explainWithGemini = (await Promise.resolve("".concat(geminiUrl)).then(function (s) { return require(s); })).explainWithGemini;
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// health / root
app.get('/', function (req, res) {
    res.send('AI Tutor Backend is running');
});
//auth routes
app.post("/api/auth/register", auth_Controller_1.register);
app.post("/api/auth/login", auth_Controller_1.login);
app.get("/api/auth/refresh", auth_Controller_1.refresh);
app.post("/api/auth/logout", auth_Controller_1.logout);
app.post("/api/auth/request-reset", auth_Controller_1.requestPasswordReset);
app.post("/api/auth/reset/:token", auth_Controller_1.resetPassword);
// chat API
app.post('/api/chat', auth_Middleware_1.authRequired, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, message, plotType, mathResult, aiResponse, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body || {}, message = _a.message, plotType = _a.plotType;
                return [4 /*yield*/, solveMath(message)];
            case 1:
                mathResult = _b.sent();
                return [4 /*yield*/, explainWithGemini(message, mathResult, plotType)];
            case 2:
                aiResponse = _b.sent();
                res.json(aiResponse);
                return [3 /*break*/, 4];
            case 3:
                err_1 = _b.sent();
                console.error('Error in /api/chat:', err_1);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Determine frontend build folder (try multiple candidates)
var candidates = [
    // backend/dist/frontend (when copied)
    path_1.default.resolve(__dirname, 'frontend'),
    // repo-root/frontend/dist when backend/dist is one level deeper
    path_1.default.resolve(__dirname, '..', 'frontend', 'dist'),
    // repo-root/frontend/dist when started from repo root
    path_1.default.resolve(process.cwd(), 'frontend', 'dist'),
    // repo-root/dist/frontend
    path_1.default.resolve(process.cwd(), 'dist', 'frontend'),
];
var frontendPath = null;
for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
    var c = candidates_1[_i];
    if (fs_1.default.existsSync(c)) {
        frontendPath = c;
        break;
    }
}
// Debug logs for Render / production troubleshooting
console.log('server debug:');
console.log('  NODE_ENV =', process.env.NODE_ENV);
console.log('  process.cwd() =', process.cwd());
console.log('  candidate frontend paths =', candidates);
console.log('  selected frontendPath =', frontendPath);
if (frontendPath) {
    // serve static files in production (and also in non-prod if you want to debug)
    if (process.env.NODE_ENV === 'production') {
        app.use(express_1.default.static(frontendPath));
        app.get(/.*/, function (req, res) {
            res.sendFile(path_1.default.join(frontendPath, 'index.html'));
        });
        console.log('Serving frontend from', frontendPath);
    }
    else {
        // helpful for debugging on Render if NODE_ENV not set
        console.log('Found frontend build but NODE_ENV != production — serving anyway for debug.');
        app.use(express_1.default.static(frontendPath));
        app.get(/.*/, function (req, res) {
            res.sendFile(path_1.default.join(frontendPath, 'index.html'));
        });
    }
}
else {
    console.log('No frontend build found. Static serving disabled.');
}
// start server
var port = Number(process.env.PORT || 3001);
app.listen(port, function () {
    console.log("Server running on port ".concat(port));
});
