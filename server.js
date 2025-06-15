const express = require("express");
const app = express();

const port = 3000;
const indexRouter = require("./routers/index.js");

require("dotenv").config();
const SpotifyWebApi = require("spotify-web-api-node");

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID, // Key MUST be named "clientId" and not things like "clientID"
    clientSecret: process.env.CLIENT_SECRET,
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

// Setup Express to use `.ejs` as default template engine
// Now `response.render()` looks in `./views` directory for `.ejs` files by default
app.set("view engine", "ejs");

// Set location of static files (i.e. images, `.css`, `.js`)
// Now the `.ejs` file > `<head>` > `<link href>` looks in `./public` directory by default
app.use(express.static(`${__dirname}/public`));

// To parse form submissions
app.use(express.urlencoded({ extended: true }));

// Set `response.locals` variables so it acts as "global" (not really but yeah) variables
app.use((request, response, next) => {
    response.locals.spotifyApi = spotifyApi;
    response.locals.headTitle = {
        pageName: "Unknown",
        remainder: " | Next Track",
    };
    next();
});

// Routers to handle endpoints (i.e. URLs) with prefixes (if any)
app.use("/", indexRouter); // No prefixes in this case

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
