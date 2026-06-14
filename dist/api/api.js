"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests"
});
const morgan = require("morgan");
const express = require("express");
const verifyRequest = require("./verifyRequest");
const app = express();
app.use(limiter);
app.use(morgan("combined"));
app.use(express.json());
const PORT = process.env.PORT;
module.exports = function (db, client) {
    // Add a route for each folder in current directory
    fs.readdirSync(__dirname).forEach(file => {
        const fullPath = path.join(__dirname, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            console.log(`Checking route for ${file}`);
            const getFilePath = path.join(fullPath, "get.js");
            // If there is a get file, add it
            if (fs.existsSync(getFilePath)) {
                app.get(`/api/${file}`, verifyRequest, (req, res) => {
                    require(getFilePath)(req, res, db, client);
                });
            }
            const getPostPath = path.join(fullPath, "post.js");
            if (fs.existsSync(getPostPath)) {
                app.post(`/api/${file}`, verifyRequest, (req, res) => {
                    require(getPostPath)(req, res, db, client);
                });
            }
        }
    });
    app.listen(PORT, "127.0.0.1", () => {
        console.log(`Server is running on port ${PORT}`);
    });
};
