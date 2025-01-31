const fs = require("fs");
const path = require("path");

const express = require("express");
const verifyRequest = require("./verifyRequest.js");
const app = express();

app.use(express.json());

const PORT = process.env.PORT;

module.exports = function(db, client) {
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
}