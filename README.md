# Accessing The Application

## Online (easy)

Visit https://fyp-nexttrack-old.vercel.app.

## Locally (hard)

1. [Clone](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) this repository into your local machine.

2. Ensure there is a `.env` file at the root directory (i.e. `./.env`) with the following variables and their respective values:

```
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
LASTFM_API_KEY
LASTFM_SECRET
GENIUS_CLIENT_ID
GENIUS_CLIENT_SECRET
```

3. Open the terminal to the root directory (i.e. `./`), and run:

```
npm i
npm run start
```

4. Visit the `localhost` link provided.
