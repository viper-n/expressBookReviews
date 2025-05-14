const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
        if (!isValid(username)) {
            users.push({ "username": username, "password": password });
            return res.status(200).json({ message: "User successfully registered. Now you can login!" });
        }
        else {
            return res.status(404).json({ message: "Error: User already exists!" });
        }
    }
    return res.status(404).json({ message: "Error: Unable to register user" });
});

// Get the book list available in the shop
public_users.get('/', function (req, res) {
    return new Promise((resolve, reject) => {
        resolve(JSON.stringify(books, null, 4));
    })
        .then((allbooks) => {
            res.send(allbooks);
        })
        .catch((err) => {
            console.error("Error:", err);
            res.status(500).send("Internal Server Error");
        });
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
    return new Promise((resolve, reject) => {
        resolve(books[req.params.isbn]);
    })
        .then((details) => {
            res.send(details);
        })
        .catch((err) => {
            console.error("Error:", err);
            res.status(500).send("Internal Server Error");
        });
});

// Get book details based on author (can return multiple books if author is repeated)
const he = require('he');

public_users.get('/author/:author', function (req, res) {
    const authorParam = req.params.author;

    getBooksByAuthor(authorParam)
        .then((foundBooks) => {
            res.send(foundBooks);
        })
        .catch((err) => {
            console.error("Error:", err);
            const safeAuthor = he.encode(authorParam); // Sanitize user input
            res.status(404).json({ message: `Error: Author ${safeAuthor} not found!` });
        });
});

// Function to retrieve books by author
function getBooksByAuthor(author) {
    return new Promise((resolve, reject) => {
        const foundBooks = [];
        for (let key in books) {
            if (books[key].author === author) {
                foundBooks.push(books[key]);
            }
        }
        if (foundBooks.length !== 0) {
            resolve(foundBooks);
        } else {
            reject(`Author ${author} not found`);
        }
    });
}

// Get all books based on title
const he = require('he');

public_users.get('/title/:title', function (req, res) {
    const titleParam = req.params.title;

    getBooksByTitle(titleParam)
        .then((foundBooks) => res.send(foundBooks))
        .catch((err) => {
            console.error("Error:", err);
            const safeTitle = he.encode(titleParam); // sanitize for safe output
            res.status(404).json({ message: `Error: Title ${safeTitle} not found!` });
        });
});

// Function to retrieve books by title
function getBooksByTitle(title) {
    return new Promise((resolve, reject) => {
        for (let key in books) {
            if (books[key].title == title) {
                resolve(JSON.stringify(books[key]));
            }
        }
        reject(`Error: Book with title ${title} not found!`);
    });
}

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
    const review = books[req.params.isbn].reviews;
    res.send(review);
});

module.exports.general = public_users;
