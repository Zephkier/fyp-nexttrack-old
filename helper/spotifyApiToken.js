require("dotenv").config();
const SpotifyWebApi = require("spotify-web-api-node");

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID, // Key MUST be named "clientId" and not things like "clientID"
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

async function retrieveSpotifyApiToken() {
    try {
        let data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body.access_token);
    } catch (err) {
        console.error(`[!]\nIn ./helper/spotifyApiToken.js > spotifyApi:\n${err}\n[!]`);
        throw err; // Send `err` to Express to inform user
    }
}

module.exports = { spotifyApi, retrieveSpotifyApiToken };
