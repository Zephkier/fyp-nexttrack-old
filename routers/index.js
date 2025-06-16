const express = require("express");
const router = express.Router();

const axios = require("axios");
const {
    // Format
    spotifyApi,
    retrieveSpotifyApiToken,
    refreshSpotifyApiToken,
} = require("../helper/spotifyApiToken.js");

router.get("/", refreshSpotifyApiToken, (request, response) => {
    // Always set `pageName`
    response.locals.headTitle.pageName = "Home";

    let exampleTracks = [
        {
            artistAndName: '"Playboi Carti" - Bando',
            note: "test an unknown artist",
            link: "https://open.spotify.com/track/6z7dQwXh9UJJl4wsWxexuI?si=308467749bd94d0d",
        },
        {
            artistAndName: "The Beatles - Something",
            note: "test a single artist",
            link: "https://open.spotify.com/track/0pNeVovbiZHkulpGeOx1Gj?si=b9def5c53fe943a7",
        },
        {
            artistAndName: "Selena, benny, Marias - Ojos Tristes",
            note: "test multiple artists",
            link: "https://open.spotify.com/track/1DFmBjoeQN9DpOVTEewyx0?si=210d4a8f264e4430",
        },
        {
            artistAndName: "Florence + The Machine - Dog Days Are Over",
            note: 'test "+" character for Last.fm API',
            link: "https://open.spotify.com/track/456WNXWhDwYOSf5SpTuqxd?si=e9a5cc69ef9b4ffe",
            // Last.fm site: https://www.last.fm/music/Florence+%252B+the+Machine/_/Dog+Days+Are+Over
            // `endpoint`:   http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=61aa236a275bc7ac487a704ec9dccf12&artist=Florence%20+%20The%20Machine&track=Dog%20Days%20Are%20Over&format=json
        },
        {
            artistAndName: "AC/DC - Thunderstruck",
            note: 'test "/" character for Last.fm API',
            link: "https://open.spotify.com/track/57bgtoPSgt236HzfBOd8kj?si=1f3b7d2fbc074a5e",
            // Last.fm site: https://www.last.fm/music/AC%2FDC/_/Thunderstruck
            // `endpoint`:   http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=61aa236a275bc7ac487a704ec9dccf12&artist=AC/DC&track=Thunderstruck&format=json
        },
        {
            artistAndName: "Dimitri Vegas & Like Mike - Thank You (Not So Bad)",
            note: 'test "&" character for Last.fm API',
            link: "https://open.spotify.com/track/09CnYHiZ5jGT1wr1TXJ9Zt?si=68c00376f8e7456a",
            // Last.fm site: https://www.last.fm/music/Dimitri+Vegas+&+Like+Mike/_/Thank+You+(Not+So+Bad)
            // `endpoint`:   http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=61aa236a275bc7ac487a704ec9dccf12&artist=Dimitri%20Vegas%20&%20Like%20Mike&track=Thank%20You%20(Not%20So%20Bad)&format=json
        },
    ];

    return response.render("./index.ejs", {
        pageName: response.locals.headTitle.pageName,
        exampleTracks: exampleTracks,
    });
});

router.post("/recommendations", (request, response) => {
    try {
        // Get track's ID from submitted track link
        // From "https[colon]//open.spotify.com/track/6z7dQwXh9UJJl4wsWxexuI?si=308467749bd94d0d"
        // To                                        "6z7dQwXh9UJJl4wsWxexuI"
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

router.get(`/recommendations/:spotify_trackID`, refreshSpotifyApiToken, async (request, response) => {
    // Always set `pageName`
    response.locals.headTitle.pageName = "Recommendations";

    // Set variables here so they are accessible across try-catch blocks
    let spotify_trackID = request.params.spotify_trackID;
    let spotify_trackData = null;
    let trackName = null;
    let artistName = null;
    let lastFm_genreTags = null;

    // Spotify API: Get track name and artist name
    try {
        spotify_trackData = await spotifyApi.getTrack(spotify_trackID);
        // return response.json(spotify_trackData.body); // Check
        trackName = spotify_trackData.body.name;
        artistName = spotify_trackData.body.artists[0].name;
    } catch (error) {
        /**
         * TODO
         * Send to home or error page
         */
        console.error(`[!]\nIn ./routers/index.js > .get("/recommendations/:spotify_trackID"):\n${error}\n[!]`);
        return response.redirect("/?error=cannotRetrieveTrackDataFromSpotify");
    }

    // Last.fm API: Get genre(s) or tag(s) as Last.fm calls it
    try {
        // JSON: /2.0/?method=track.getInfo&api_key=YOUR_API_KEY&artist=cher&track=believe&format=json
        /**
         * FIXME
         * Track/Artist names with special characters (e.g. Florence + The Machine, AC/DC, W&W) does not work 100% of the time.
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

        /**
         * FIXME
         * Handle cases when Spotify track is unavailable on Last.fm (e.g. "Playboi Carti" - Bando)
         */
        // `lastFm_axiosResponse` has properties like `.data`, `.status`, `.statusText`, `.headers`, `.config`
        // But cannot assign all at once, must do it individually
        let lastFm_axiosResponse = await axios.get(endpoint);
        // return response.json(lastFm_axiosResponse.data); // Check
        lastFm_genreTags = lastFm_axiosResponse.data.track.toptags.tag;
    } catch (error) {
        /**
         * TODO
         * Send to home or error page
         */
        console.error(`[!]\nIn ./routers/index.js > .get("/recommendations/:spotify_trackID"):\n${error}\n[!]`);
        return response.redirect("/?error=cannotRetrieveTrackDataFromLastFm");
    }

    let dummyRecommendedTracks = [
        {
            name: "Bohemian Rhapsody",
            artist: "Queen",
            link: {
                spotify: "https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv?si=d402b163ddcb40b9",
                appleMusic: "https://music.apple.com/us/song/bohemian-rhapsody/1440650711",
                youtubeMusic: "https://music.youtube.com/watch?v=bSnlKl_PoQU&si=rizExhbi-h_Zog7w",
                // Can try using the YouTube video that is already in Last.fm's "About" page)
                // From "https://www.youtube.com/watch?v=fJ9rUzIMcZQ"
                // To                                   "fJ9rUzIMcZQ"
                video: "fJ9rUzIMcZQ",
            },
            lyrics: "https://genius.com/Queen-bohemian-rhapsody-lyrics",
            about: {
                // See <h4 class="ContributorSidebarSection__Title-sc-65fb4caa-8 htPphm">About</h4>
                genius: "https://genius.com/Queen-bohemian-rhapsody-lyrics",
                lastFm: "https://www.last.fm/music/Queen/_/Bohemian+Rhapsody+-+Remastered+2011/+wiki",
            },
            comments: {
                genius: "https://genius.com/Queen-bohemian-rhapsody-lyrics#comments",
                lastFm: "https://www.last.fm/music/Queen/_/Bohemian+Rhapsody+-+Remastered+2011#shoutbox",
            },
        },
        {
            name: "Yellow",
            artist: "Coldplay",
            link: {
                spotify: "https://open.spotify.com/track/3AJwUDP919kvQ9QcozQPxg?si=d5ef72260b42406a",
                appleMusic: "https://music.apple.com/us/song/yellow/1122782283",
                youtubeMusic: "https://music.youtube.com/watch?v=9qnqYL0eNNI&si=wQ2XdteTSQePEOve",
                // Can try using the YouTube video that is already in Last.fm's "About" page)
                // From "https://www.youtube.com/watch?v=yKNxeF4KMsY"
                // To                                   "yKNxeF4KMsY"
                video: "yKNxeF4KMsY",
            },
            lyrics: "https://genius.com/Queen-bohemian-rhapsody-lyrics",
            about: {
                // See <h4 class="ContributorSidebarSection__Title-sc-65fb4caa-8 htPphm">About</h4>
                genius: "https://genius.com/Coldplay-yellow-lyrics",
                lastFm: "https://www.last.fm/music/Coldplay/_/Yellow/+wiki",
            },
            comments: {
                genius: "https://genius.com/Coldplay-yellow-lyrics#comments",
                lastFm: "https://www.last.fm/music/Coldplay/_/Yellow#shoutbox",
            },
        },
    ];

    return response.render("./recommendations.ejs", {
        pageName: response.locals.headTitle.pageName,
        spotify_trackDetails: spotify_trackData.body,
        lastFm_genreTags: lastFm_genreTags,
        dummyRecommendedTracks: dummyRecommendedTracks,
    });
});

// Invalid endpoints
router.get("/*others", (request, response) => {
    return response.redirect("/");
});

module.exports = router;
