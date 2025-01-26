function doSql(db, sql, args) {
    return new Promise((res, rej) => {
        db.all(sql, args, (err, rows) => {
            if (err) rej(err);
            else res(rows);
        });
    });
}

module.exports = { doSql };