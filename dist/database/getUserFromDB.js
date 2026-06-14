"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getUserDB(db, roblox_id) {
    /*await new Promise((resolve, reject) => {
        misc.db.all("SELECT * FROM users WHERE roblox_id = ?", [playerId], (err, rows) => {
            if (err) {
                console.error("Query error:", err.message);

                return;
            }

            console.log(rows);
        });
    })*/
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM users WHERE roblox_id = ?", [roblox_id], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}
module.exports = { getUserDB };
