import passport from "passport";

import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { env } from "./env";
import User from "../models/user.model";

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
        const email = profile.emails?.[0]?.value;
        const user = await User.findOne({ email });
        if (!user) {
          const newUser = await User.create({
            name,
            email,
            googleId,
          });
          return done(null, newUser);
        }
        return done(null, user);
      } catch (error) {
        done(error, undefined);
      }
    },
  ),
);
export default passport;
