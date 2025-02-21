const crypto = require("crypto");

module.exports = function(req, res, next) {
    const timestamp = req.headers["x-timestamp"];
    const signature = req.headers["x-signature"];
    let dataToSign;

    if (!timestamp || !signature) {
        return res.status(403).json({ error: "Missing signature or timestamp." });
    }
/*
    const now = Math.floor(Date.now() / 1000);
    const then = Math.floor(+timestamp);
    const deltaTime = Math.abs(now - then);

    // Check if the request is expired
    if (deltaTime > 6) {
        return res.status(400).json({ error: "Request expired." });
    }*/

    if (req.method === "POST" && req.body) {
        dataToSign = JSON.stringify(req.body);
    } else {
        dataToSign = new URLSearchParams(req.query).toString();
    }

    dataToSign += timestamp;

    // Recompute HMAC using the query string and timestamp
    const computedSignature = crypto
        .createHmac("sha256", process.env.SECRET_KEY)
        .createHmac("sha256", process.env.SECRET_KEY) // TODO: Use env variables for the secret
        .update(dataToSign)
        .digest("hex");

    // Compare the computed signature with the provided signature
    if (computedSignature !== signature) {
        return res.status(403).json({ error: "Invalid signature." });
    }

    next(); // Continue to the actual route handler
}