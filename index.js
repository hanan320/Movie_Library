'use strict'

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();


const { Client } = require('pg');
const url = process.env.URL;

const DataBase= process.env.PG_DATABASE
const UserName= process.env.PG_USER
const password= process.env.PG_PASSWORD
const Host = process.env.PG_HOST
const Port= process.env.PG_PORT
const client = new pg.Client(`postgresql://(( UserName}:${password}@${Host}:${Port}/${DataBase}`);



const app = express();
const port = 8080;

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(cors());
const apiKey = process.env.API_KEY;



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

//lab14
app.put('/update/:id',updateHandler);
app.delete('/delete/:id',deleteHandler);
app.get('/getmovie/:id', getMovieHandler);

//get Movie Handler
function getMovieHandler(req, res) {
    const id = req.params.id;
    const sql = `SELECT * FROM movies WHERE id = $1`;

    client.query(sql, [id]).then(result => {
        console.log(result.rows);
        res.status(200).json(result.rows);
    })
    .catch(err => {
        console.error('Getting movie failed:', err);
        res.status(500).send('Getting movie failed');
    });
}

//Delete Handeler
function deleteHandler(req, res) {
    const id  = req.params.id;
    const values = [id];
    const sql = 'DELETE FROM movies WHERE id = $1';

    client.query(sql, values)
        .then(() => {
            console.log('Movie deleted');
            res.sendStatus(204); // Use res.sendStatus() for sending status codes without message
        })
        .catch(error => {
            console.error('Error deleting a movie:', error);
            res.status(500).send('Error deleting movie');
        });
}

//Update Handeler
function updateHandler(req, res) {
    const { title, release_date, poster_path, overview } = req.body;
    const id = req.params.id; // Change variable name to lowercase 'id'
    const data = [title, release_date, poster_path, overview, id]; // Include id in the 'data' array
    const sql = `UPDATE movies
                 SET title = $1, release_date = $2, poster_path = $3, overview = $4
                 WHERE id = $5 RETURNING *`; // Use placeholder for 'id'

    client.query(sql, data)
        .then(result => {
            console.log('Movie updated:', result.rows);
            res.status(200).json(result.rows);
        })
        .catch(error => {
            console.error('Error updating a movie:', error);
            res.status(500).send('Error updating movie');
        });
}

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

    const { title, release_date, poster_path, overview } = req.body;

    const sql = `INSERT INTO movies (title, release_date, poster_path, overview)
            VALUES ($1, $2, $3, $4) RETURNING *`;

    const values = [title, release_date, poster_path, overview];

    
    client.query(sql, values)

    .then((result) => {
        console.log(result.rows);
    return res.status(201).json(result.rows) })

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


