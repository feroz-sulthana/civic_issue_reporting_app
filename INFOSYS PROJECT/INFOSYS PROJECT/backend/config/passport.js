const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const axios = require("axios");
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

      // Production safe callback
      callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {

        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(null, false);

        /* ================= FETCH PHOTO FROM GOOGLE PEOPLE API ================= */

        let photoUrl = "";

        try {

          const peopleRes = await axios.get(
            "https://people.googleapis.com/v1/people/me?personFields=photos",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          photoUrl =
            peopleRes.data.photos?.find(
              (p) => p.metadata?.primary === true
            )?.url || "";

        } catch {
          photoUrl = "";
        }

        /* ================= FIND OR CREATE USER ================= */

        let user = await User.findOne({ email });

        if (!user) {

          const baseUsername = email.split("@")[0];
          let username = baseUsername;
          let counter = 1;

          while (await User.findOne({ username })) {
            username = `${baseUsername}${counter++}`;
          }

          user = await User.create({
            name: profile.displayName,
            email,
            username,
            provider: "google",
            profilePhoto: photoUrl,
          });

        } else {

          if (!user.profilePhoto && photoUrl) {
            user.profilePhoto = photoUrl;
            await user.save();
          }

        }

        return done(null, user);

      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;