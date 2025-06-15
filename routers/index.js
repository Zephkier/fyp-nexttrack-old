const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {
    // Always set `pageName`
    response.locals.headTitle.pageName = "Home";

    return response.render("./index.ejs", {
        pageName: response.locals.headTitle.pageName,
    });
});

router.post("/recommendations", (request, response) => {
    try {
        // Get track's ID from submitted track link
        // i.e. from: "https[colon]//open.spotify.com/track/6z7dQwXh9UJJl4wsWxexuI?si=308467749bd94d0d"
        //        to:                                      "6z7dQwXh9UJJl4wsWxexuI"
        let trackID = request.body.submittedTrackLink // Format
            .split("track/")[1]
            .split("?si=")[0];
        // console.log(`[!]\nconsole.logged:\n${trackID}\n[!]`);

        return response.redirect(`/recommendations/${trackID}`);
    } catch (err) {
        // TODO: send to home/error page
        console.error(`[!]\nIn index.js > .post("/recommendations"):\n${err}\n[!]`);
        return response.redirect("/?error=invalidLink");
    }
});

router.get(`/recommendations/:trackID`, async (request, response) => {
    // Always set `pageName`
    response.locals.headTitle.pageName = "Recommendations";

    try {
        let trackID = request.params.trackID;
        let trackData = await response.locals.spotifyApi.getTrack(trackID);
        // return response.json(trackData.body); // Works better than `console.log()` as there are many key-value pairs

        /**
         * FIXME: i ACTUALLY cannot get audio features and other data due to Spotify API changes:
         * https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api
         * https://www.reddit.com/r/spotifyapi/comments/1h1o2m9/spotify_api_changes/
         *
         * alternate solution(s):
         * - non-audio based recommendations (i.e. metadata based recommendations)
         * - using datasets
         *   - https://www.kaggle.com/datasets/zaheenhamidani/ultimate-spotify-tracks-db
         *   - https://github.com/spotipy-dev/spotipy
         *   - http://millionsongdataset.com/index.html
         */
        try {
            return response.json(await response.locals.spotifyApi.getAudioFeaturesForTrack(trackID));
        } catch (audioFeaturesErr) {
            console.error(`[!]\nIn index.js > .get("/recommendations/:trackID"):\n${audioFeaturesErr}\n[!]`);
            /**
             * [!]
             * In index.js > .get("/recommendations/:trackID"):
             * WebapiRegularError: An error occurred while communicating with Spotify's Web API.
             * Details: undefined.
             * [!]
             */
        }

        return response.render("./recommendations.ejs", {
            pageName: response.locals.headTitle.pageName,
            submittedTrackDetails: trackData.body,
        });
    } catch (err) {
        // TODO: send to home/error page
        console.error(`[!]\nIn index.js > .get("/recommendations/:trackID"):\n${err}\n[!]`);
        return response.redirect("/?error=unableToRetrieveTrackData");
    }
});

// Invalid endpoints
router.get("/*others", (request, response) => {
    return response.redirect("/");
});

module.exports = router;
