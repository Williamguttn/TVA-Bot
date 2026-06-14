"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = function (db) {
    db.all("SELECT * FROM users ORDER BY roblox_id", [], (err, rows) => {
        if (err) {
            console.error("Query error:", err.message);
            return;
        }
        console.log("Query results:", rows);
    });
};
