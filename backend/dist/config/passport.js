"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const env_1 = require("./env");
const user_model_1 = __importDefault(require("../models/user.model"));
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: env_1.env.CLIENT_ID,
    clientSecret: env_1.env.CLIENT_SECRET,
    callbackURL: env_1.env.CLIENT_CALLBACK_URI,
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const googleId = profile.id;
        const name = profile.displayName;
        const email = profile.emails?.[0]?.value;
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            const newUser = await user_model_1.default.create({
                name,
                email,
                googleId,
            });
            return done(null, newUser);
        }
        return done(null, user);
    }
    catch (error) {
        done(error, undefined);
    }
}));
exports.default = passport_1.default;
