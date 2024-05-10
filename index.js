'use strict'

const express = require('express');
const cors = require('cors');
const axios = require('axios');


const { Client } = require('pg');
const url = 'postgres://hanan:0000@localhost:5432/lab13'
const client = new Client(url)


const app = express();
const port = 8080;

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(cors());
const apiKey = '6571af2130113b656cd86322253a0b84';


// Import movie data from data.json file
const data = require('./movie_data/data.json');

//routs
app.get('/', homePageHandler);
app.get('/favorite', favoriteHandler);

//routs for lab 12
app.get("/trending", handelTrending);
app.get("/search", searchHandler);
app.get("/upcoming", upcomingHandler);
app.get("/discover", discoverHandler);

//routs lab13
app.post('/addMovie', addMovieHandler);
app.get('/viewMovies', viewMoviesHandler);

// Constructor function for movie data
function movieData(title, poster_path, overview) {
    this.title = title;
    this.poster_path = poster_path;
    this.overview = overview;
}

//Constructor function for movie in api data
function Movie(id, title, release_data, poster_path, overview) {
    this.id = id;
    this.title = title;
    this.release_data = release_data;
    this.poster_path = poster_path;
    this.overview = overview;
}

function viewMoviesHandler(req,res) {

    const sql = 'SELECT * FROM movies;';

    client.query(sql)
        .then((result) => {
            return res.status(201).json(result.rows);
        })
}

function addMovieHandler(req, res) {

    console.log(req.body);

    const { id, title, release_date, poster_path, overview } = req.body;
    let sql = `INSERT INTO movies (id, title, release_date, poster_path, overview)
        VALUES ($1, $2, $3, $4, $5) RETURNING*;`
    let value = [id, title, release_date, poster_path, overview]
    client.query(sql, value)
        .then((result) => {
            console.log(result.rows);
            return res.status(201).json(result.rows)
        })

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



// Handler function for the favorite page
function favoriteHandler(req, res) {
    res.send("Welcome to favorite page");
}




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

//Trending Handeler
function handelTrending(req, res) {

    const url = `https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}`;
    axios.get(url)
        .then(result => {
            console.log(result.data.results);
            let trending = result.data.results.map(trend => {
                return new Movie(
                    trend.id,
                    trend.title,
                    trend.release_data,
                    trend.poster_path,
                    trend.overview
                )
            })

            res.json(trending);
        })
        .catch(error => {
            console.error(error);
            res.status(500).json('Internal Server Error');

        });

}

//search Handler
function searchHandler(req, res) {
    // Extract movieName from query parameters
    const movieName = req.query.movieName;
    // Construct URL for movie search API
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movieName}`;

    // Make request to movie search API
    axios.get(url)
        .then(result => {
            // Extract relevant data from the response and create movie objects
            const searching = result.data.results.map(movie => {
                return new Movie(
                    movie.id,
                    movie.title,
                    movie.release_date,
                    movie.poster_path,
                    movie.overview
                );
            });
            res.json(searching); // Send the formatted movie data as response
        })
        .catch(error => {
            console.error(error);
            res.status(500).json('Internal Server Error');
        });
}

//upcoming Handler
function upcomingHandler(req, res) {
    const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}`;
    axios.get(url)
        .then(result => {
            console.log(result.data.results);
            let upcoming = result.data.results.map(trend => {
                return new Movie(
                    trend.id,
                    trend.title,
                    trend.release_data,
                    trend.poster_path,
                    trend.overview
                );
            });
            res.json(upcoming);
        })
        .catch(error => {
            console.error(error);
            res.status(500).json('Internal Server Error');
        });
}

//upcoming Handler
function discoverHandler(req, res) {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}`;
    axios.get(url)
        .then(result => {
            console.log(result.data.results);
            let upcoming = result.data.results.map(trend => {
                return new Movie(
                    trend.id,
                    trend.title,
                    trend.release_data,
                    trend.poster_path,
                    trend.overview
                );
            });
            res.json(upcoming);
        })
        .catch(error => {
            console.error(error);
            res.status(500).json('Internal Server Error');
        });
}





// Handle "page not found" errors for all other routes
app.use(handlePageNotFoundError);

// Handle server errors (status 500)
app.use(handleServerError);

// Start the server
client.connect().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch()


