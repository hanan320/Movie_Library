'use strict'
const express = require('express');
const app = express();

// Import movie data from data.json file
const data = require('./movie_data/data.json');

// Constructor function for movie data
function movieData(title, poster_path, overview) {
    this.title = title;
    this.poster_path = poster_path;
    this.overview = overview;
}

// Middleware function to handle server errors (status 500)
function handleServerError(err, req, res, next) {
    console.error("Server error:", err);
    res.status(500).json({ status: 500, responseText: "Sorry, something went wrong" });
}

// Middleware function to handle "page not found" errors (status 404)
function handlePageNotFoundError(req, res) {
    res.status(404).json({ status: 404, responseText: "Page not found" });
}

// Define route for the favorite page
app.get('/favorite', favoriteHandler);

// Handler function for the favorite page
function favoriteHandler(req, res) {
    res.send("Welcome to favorite page");
}

// Define route for the home page
app.get('/', homePageHandler);

// Handler function for the home page
function homePageHandler(req, res) {
    try {
        // Create an instance of movieData using the provided data
        let oneMovie = new movieData(data.title, data.poster_path, data.overview);
        res.json(oneMovie);
    } catch (err) {
        console.error("Error occurred while processing home page data:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


// Handle "page not found" errors for all other routes
app.use(handlePageNotFoundError);

// Handle server errors (status 500)
app.use(handleServerError);

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
