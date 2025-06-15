require("dotenv").config();
const SpotifyWebApi = require("spotify-web-api-node");

/**
 * Create new instance of SpotifyWebApi via variables from `.env`.
 */
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID, // Key MUST be named "clientId" and not things like "clientID"
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

/**
 * Helper function to do as its named.
 *
 * The Spotify API token gets assigned to `spotifyApi`.
 */
async function retrieveSpotifyApiToken() {
    try {
        let data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body.access_token);
    } catch (err) {
        console.error(`[!]\nIn ./helper/spotifyApiToken.js > retrieveSpotifyApiToken():\n${err}\n[!]`);
        throw err; // Send `err` to Express to inform user
    }
}

/**
 * Middleware function (note the `request, response, next`) to do as its named.
 *
 * Calls `retrieveSpotifyApiToken()` where the Spotify API token gets assigned to `spotifyApi`.
 */
async function refreshSpotifyApiToken(request, response, next) {
    try {
        await retrieveSpotifyApiToken();
        next();
    } catch (err) {
        console.error(`[!]\nIn ./helper/spotifyApiToken.js > refreshSpotifyApiToken():\n${err}\n[!]`);
        return response.redirect("/?error=unableToRefreshSpotifyApiToken");
    }
}

module.exports = {
    // Format
    spotifyApi,
    retrieveSpotifyApiToken,
    refreshSpotifyApiToken,
};
