import passport from "passport";

import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { env } from "./env";
import User from "../models/user.model";
import ApiError from "../utils/api-error";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.CLIENT_ID!,
      clientSecret: env.CLIENT_SECRET!,
      callbackURL: env.CLIENT_CALLBACK_URI,
    },
    async (
      _accessToken,
      _refreshToken,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const googleId = profile.id;
        const name = profile.displayName;
        const providerEmail = profile.emails?.find((entry) => (entry as { verified?: boolean }).verified === true);
        const email = providerEmail?.value.trim().toLowerCase();
        if (!email || !googleId) return done(new ApiError(401, "Google could not verify this email"));
        const user = await User.findOne({ googleId });
        if (!user) {
          if (await User.exists({ email })) return done(new ApiError(409, "Sign in using your existing account method"));
          const newUser = await User.create({
            name,
            email,
            emailVerifiedAt: new Date(),
            googleId,
          });
          return done(null, newUser);
        }
        if (user.isActive !== true) {
          return done(new ApiError(403, "Account is disabled"));
        }
        return done(null, user);
      } catch (error) {
        done(error, undefined);
      }
    },
  ),
);
export default passport;
