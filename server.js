const express = require("express");
const app = express();

const port = 3000;
const indexRouter = require("./routers/index.js");

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
