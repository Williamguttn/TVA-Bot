module.exports = function(db) {
    db.all("SELECT * FROM rank_binds ORDER BY id", [], (err, rows) => {
        if (err) {
            console.error("Query error:", err.message);
            return;
        }
        console.log("Query results:", rows);
    });
}