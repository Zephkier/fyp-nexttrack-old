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
        // Get track's ID from form-submitted link
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

        // // TEST check what is inside here
        // let trackAudioFeatures = await response.locals.spotifyApi.getAudioFeaturesForTrack(trackID);
        // return response.json(trackAudioFeatures);

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
