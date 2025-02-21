const sqlite3 = require("sqlite3").verbose();

module.exports = function() {
    const db = new sqlite3.Database("data.db", (err) => {
        if (err) {
            console.error("Error connecting to the databse:", err.message);
        } else {
            console.log("Connected to the SQLite database");
        }
    });

    /*db.run(`
        CREATE TABLE IF NOT EXISTS users (
        roblox_id PRIMARY KEY INTEGER NOT NULL,
        discord_id INTEGER NOT NULL,
        status INTEGER,
        score INTEGER
        )
    `, (err) => {
        if (err) {
            console.error("Creating users table failed:", err.message);
        }
    });*/

    /*
        Reaction roles
    */
   db.run(`
        CREATE TABLE IF NOT EXISTS reaction_roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            emoji TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error("Creating medals table failed:", err.message);
        }
    });


    /*
        Medals
    */

    db.run(`
        CREATE TABLE IF NOT EXISTS medals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            display_order INTEGER NOT NULL UNIQUE
        )
    `, (err) => {
        if (err) {
            console.error("Creating medals table failed:", err.message);
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS user_medals (
            roblox_id INTEGER,
            medal_id INTEGER,
            PRIMARY KEY (roblox_id, medal_id),
            FOREIGN KEY (roblox_id) REFERENCES users(roblox_id),
            FOREIGN KEY (medal_id) REFERENCES medals(id)
        )
    `, (err) => {
        if (err) {
            console.error("Creating medals table failed:", err.message);
        }
    });

    /*
        Points is the amount of points needed to get this rank & role

        IDs must be text because IDs are too large for integers
    */
    db.run(`
        CREATE TABLE IF NOT EXISTS rank_binds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id TEXT NOT NULL DEFAULT "0",
        server_id TEXT NOT NULL DEFAULT "0",
        rank_start INTEGER NOT NULL DEFAULT 0,
        rank_end INTEGER,
        role_id TEXT NOT NULL DEFAULT "0"
        )
    `, (err) => {
        if (err) {
            console.error("Creating rankbind table failed", err.message);
        }
    });

    // Group binds
    // A direct connection between ROBLOX groups and the amount of points a player has
    db.run(`
        CREATE TABLE IF NOT EXISTS group_binds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id TEXT NOT NULL DEFAULT "0",
        rank INTEGER NOT NULL DEFAULT 0,
        points_needed INTEGER NOT NULL DEFAULT 0
        )
    `, (err) => {
        if (err) {
            console.error("Creating groupbind table failed", err.message);
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS status_binds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id TEXT NOT NULL DEFAULT "0",
        rank INTEGER NOT NULL DEFAULT 0,
        status INTEGER NOT NULL DEFAULT 1
        )
    `, (err) => {
        if (err) {
            console.error("Creating groupbind table failed", err.message);
        }
    });
    
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
        roblox_id INTEGER NOT NULL DEFAULT 0,
        discord_id TEXT,
        status INTEGER DEFAULT 1,
        score INTEGER DEFAULT 0,
        verified INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (roblox_id)
        )
    `, (err) => {
        if (err) {
            console.error("Creating users table failed:", err.message);
        }
    });

    const debug = false;

    if (debug) {
        console.log("\n\n----------------------DB DEBUG----------------------\n\n");

        db.all("SELECT * FROM users ORDER BY roblox_id", [], (err, rows) => {
            if (err) {
                console.error("Query error:", err.message);
                return;
            }
            console.log("Query results:", rows);
            
            console.log("\n\n----------------------DB DEBUG----------------------\n\n");
            // Close the database connection
            //db.close();
        });

    }

    console.log("DB LIVE");

    return db;
    /*
    const insert = db.prepare("INSERT OR REPLACE INTO users (roblox_id, discord_id) VALUES (?, ?)");

    // Handle insert errors
    insert.run(1, 1, function(err) {
        if (err) {
            console.error("Insert error:", err.message);
            return;
        }
    });
    
    insert.run(2, 2, function(err) {
        if (err) {
            console.error("Insert error:", err.message);
            return;
        }
        
        // Only query after inserts are done
        insert.finalize(); // Clean up the prepared statement
        
        // Query the results
        db.all("SELECT * FROM users ORDER BY roblox_id", [], (err, rows) => {
            if (err) {
                console.error("Query error:", err.message);
                return;
            }
            console.log("Query results:", rows);
            
            // Close the database connection
            db.close();
        });
    });*/
}