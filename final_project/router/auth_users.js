const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
    let usern = users.filter((user) => user.username === username);
    if (usern.length === 0) {
        return false;
    }
    else {
        return true;
    }
}

const authenticatedUser = (username, password) => {
    let validusers = users.filter((user) => {
        return (user.username === username && user.password === password)
    });
    if (validusers.length > 0) {
        return true;
    }
    else {
        return false;
    }
}

//only registered users can login
regd_users.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in!" });
    }

    if (authenticatedUser(username, password)) {
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60 * 60 });
        req.session.authorization = {
            accessToken, username
        }
        return res.status(200).send("User successfully logged in");
    }
    else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    let isbn = req.params.isbn;
    let book = books[isbn];
    let username = req.session.authorization.username;
    if (book) {
        book.reviews[username] = req.body.review;
        return res.send("Review added/updated.");
    }
    else {
        return res.send("Unable to find book!");
    }
});

// Delete a book review
const he = require("he");

regd_users.delete("/auth/review/:isbn", (req, res) => {
    let isbn = req.params.isbn;
    let book = books[isbn];
    let username = req.session.authorization.username;

    const escapedIsbn = he.encode(isbn); // sanitize output

    if (book) {
        if (book.reviews[username]) {
            delete book.reviews[username];
            return res.send(`Review for ISBN ${escapedIsbn} deleted`);
        } else {
            return res.send("Review not found!");
        }
    } else {
        return res.send("Unable to find book!");
    }
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
