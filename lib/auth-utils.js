const jwt = require("jsonwebtoken");
const logger = require("./logger");

const JWT_PUBLIC_KEY_RAW_VALUE = process.env.JWT_PUBLIC_KEY;

JWT_PUBLIC_KEY_RAW_VALUE || logger.error("JWT_PUBLIC_KEY is not provided.");

const JWT_PUBLIC_KEY = JWT_PUBLIC_KEY_RAW_VALUE.replace(/\\n/gm, "\n");

function getToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split("Bearer ")?.[1];
  return token;
}

function verifyAndDecodeToken(req) {
  const token = getToken(req);
  return jwt.verify(token, JWT_PUBLIC_KEY);
}

module.exports = { verifyAndDecodeToken };
