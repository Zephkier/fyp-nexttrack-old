const express = require("express");
const router = express.Router();

const axios = require("axios");
const { spotifyApi, retrieveSpotifyApiToken } = require("../helper/spotifyApiToken.js");

router.get("/", async (request, response) => {
    // Always set `pageName`
    response.locals.headTitle.pageName = "Home";

    // Always get/refresh Spotify API token
    try {
        await retrieveSpotifyApiToken();
        return response.render("./index.ejs", {
            pageName: response.locals.headTitle.pageName,
        });
    } catch (error) {
        return response.redirect("/?error=unableToGetOrRefreshSpotifyToken");
    }
});

router.post("/recommendations", (request, response) => {
    try {
        // Get track's ID from submitted track link
        // i.e. from: "https[colon]//open.spotify.com/track/6z7dQwXh9UJJl4wsWxexuI?si=308467749bd94d0d"
        //        to:                                      "6z7dQwXh9UJJl4wsWxexuI"
        let spotify_trackID = request.body.spotify_trackLink // Format
            .split("track/")[1]
            .split("?si=")[0];
        // console.log(`[!]\n${spotify_trackID}\n[!]`);
        return response.redirect(`/recommendations/${spotify_trackID}`);
    } catch (error) {
        /**
         * TODO
         * Send to home or error page
         */
        console.error(`[!]\nIn ./routers/index.js > .post("/recommendations"):\n${err}\n[!]`);
        return response.redirect("/?error=invalidLink");
    }
});

router.get(`/recommendations/:spotify_trackID`, async (request, response) => {
    // Always set `pageName`
    response.locals.headTitle.pageName = "Recommendations";

    try {
        // Always get/refresh Spotify API token
        await retrieveSpotifyApiToken();

        // ----- Spotify API
        let spotify_trackID = request.params.spotify_trackID;
        let spotify_trackData = await spotifyApi.getTrack(spotify_trackID);
        // return response.json(spotify_trackData.body); // Better than `console.log()`

        let trackName = spotify_trackData.body.name;
        let artistName = spotify_trackData.body.artists[0].name;

        // ----- Last.fm API
        // JSON: /2.0/?method=track.getInfo&api_key=YOUR_API_KEY&artist=cher&track=believe&format=json
        /**
         * FIXME
         * Track/Artist names with special characters (e.g. Florence + The Machine, AC/DC, W&W) does not work 100% of the time.
         *
         * TEST + (works)
         * - Spotify link: Florence + The Machine - Dog Days Are Over @ https://open.spotify.com/track/456WNXWhDwYOSf5SpTuqxd?si=e9a5cc69ef9b4ffe
         * - Last.fm site: https://www.last.fm/music/Florence+%252B+the+Machine/_/Dog+Days+Are+Over
         * - `endpoint`:   http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=61aa236a275bc7ac487a704ec9dccf12&artist=Florence%20+%20The%20Machine&track=Dog%20Days%20Are%20Over&format=json
         *
         * TEST / (works)
         * - Spotify link: AC/DC - Thunderstruck @ https://open.spotify.com/track/57bgtoPSgt236HzfBOd8kj?si=1f3b7d2fbc074a5e
         * - Last.fm site: https://www.last.fm/music/AC%2FDC/_/Thunderstruck
         * - `endpoint`:   http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=61aa236a275bc7ac487a704ec9dccf12&artist=AC/DC&track=Thunderstruck&format=json
         *
         * TEST & (does not work)
         * - Spotify link: Dimitri Vegas & Like Mike - Thank You (Not So Bad) @ https://open.spotify.com/track/09CnYHiZ5jGT1wr1TXJ9Zt?si=68c00376f8e7456a
         * - Last.fm site: https://www.last.fm/music/Dimitri+Vegas+&+Like+Mike/_/Thank+You+(Not+So+Bad)
         * - `endpoint`:   http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=61aa236a275bc7ac487a704ec9dccf12&artist=Dimitri%20Vegas%20&%20Like%20Mike&track=Thank%20You%20(Not%20So%20Bad)&format=json
         *
         * I've tried:
         * - `{artistName}`
         * - `{encodeURI(artistName)}`
         * - `{encodeURIComponent(artistName)}`
         */
        let baseUrl = "http://ws.audioscrobbler.com/2.0/";
        let method = "track.getInfo";
        let apiKey = process.env.LASTFM_API_KEY;
        let endpoint = `${baseUrl}?method=${method}&api_key=${apiKey}&artist=${encodeURI(artistName)}&track=${encodeURI(trackName)}&format=json`;
        // console.log(`[!]\n${endpoint}\n[!]`);

        // Must assign individual Axios object properties, cannot do it all at once
        // i.e. `let lastFm_axiosResponse = await axios.get(endpoint);`
        let lastFm_axiosResponse = {};
        await axios // Format
            .get(endpoint)
            .then(function (response) {
                lastFm_axiosResponse.data = response.data; // Main thing to focus on
                lastFm_axiosResponse.status = response.status;
                lastFm_axiosResponse.statusText = response.statusText;
                lastFm_axiosResponse.headers = response.headers;
                lastFm_axiosResponse.config = response.config;
            });
        // return response.json(lastFm_axiosResponse); // Better than `console.log()`

        /**
         * FIXME
         * Handle cases when Spotify track is not available on Last.fm (e.g. "Playboi Carti" - Bando)
         */
        let lastFm_genreTags = lastFm_axiosResponse.data.track.toptags.tag;
        // return response.json(lastFm_genreTags); // Better than `console.log()`

        return response.render("./recommendations.ejs", {
            pageName: response.locals.headTitle.pageName,
            spotify_trackDetails: spotify_trackData.body,
            lastFm_genreTags: lastFm_genreTags,
        });
    } catch (error) {
        /**
         * TODO
         * Send to home or error page
         */
        console.error(`[!]\nIn ./routers/index.js > .get("/recommendations/:trackID"):\n${error}\n[!]`);
        // When error is due to Spotify API token
        if (error.message == "unableToRetrieveSpotifyApiToken") {
            return response.redirect("/?error=unableToRetrieveSpotifyApiToken");
        }
        // When error is due to Last.fm/Axios
        return response.redirect("/?error=unableToRetrieveTrackData");
    }
});

// Invalid endpoints
router.get("/*others", (request, response) => {
    return response.redirect("/");
});

module.exports = router;
