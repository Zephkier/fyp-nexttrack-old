require("dotenv").config();
const SpotifyWebApi = require("spotify-web-api-node");

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID, // Key MUST be named "clientId" and not things like "clientID"
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

spotifyApi
    .clientCredentialsGrant()
    .then((data) => {
        spotifyApi.setAccessToken(data.body.access_token);
        // console.log(`[!]\nSpotify API token granted, expires in ${data.body.expires_in} seconds\n[!]`);
    })
    .catch((err) => {
        console.error(`[!]\nIn server.js > spotifyApi:\n${err}\n[!]`);
    });

module.exports = spotifyApi;
