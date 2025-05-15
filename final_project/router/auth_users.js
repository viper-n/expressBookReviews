const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();
const session = require("express-session");
const { body, validationResult } = require("express-validator");

const he = require("he");

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
const regd_users = express.Router();

// Assume this is a secure password check (e.g., using bcrypt)
function authenticatedUser(username, password) {
    // Your actual auth logic here
    return true; // placeholder
}

regd_users.use(express.json());
regd_users.use(session({
    secret: 'your-session-secret', // use env vars in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set true if using HTTPS
}));

regd_users.post("/login",
    // Input validation & sanitization
    body('username').trim().escape(),
    body('password').notEmpty(),

    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Invalid input.", errors: errors.array() });
        }

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password required." });
        }

        if (authenticatedUser(username, password)) {
            // Do NOT put password in JWT payload
            const accessToken = jwt.sign({ username }, 'access', { expiresIn: '1h' });

            // Regenerate session to prevent fixation attacks
            req.session.regenerate(err => {
                if (err) {
                    return res.status(500).json({ message: "Session error." });
                }

                req.session.authorization = {
                    accessToken,
                    username
                };

                return res.status(200).json({ message: "User successfully logged in." });
            });
        } else {
            return res.status(401).json({ message: "Invalid login credentials." });
        }
    }
);

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
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const rawIsbn = req.params.isbn;
    const isbn = he.encode(rawIsbn); // Escape to prevent XSS in response
    const book = books[rawIsbn]; // Use the raw version for lookup
    const username = req.session?.authorization?.username;

    if (!username) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (book) {
        if (book.reviews[username]) {
            delete book.reviews[username];
            return res.type('text').send(`Review for ISBN ${isbn} deleted`);
        } else {
            return res.status(404).type('text').send("Review not found!");
        }
    } else {
        return res.status(404).type('text').send("Unable to find book!");
    }
});



module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
