const logger = require("../lib/logger");

const { processFHIRResponse } = require("../lib/consent-enforcement-service");
const {
  sendResponse,
  responseIsError,
  sendJsonResponse,
  parseResponseBody
} = require("../lib/response-utils");
const { proxyResponseExceptionResponse } = require("../lib/error-utils");

const FHIR_SERVER_BASE = process.env.FHIR_SERVER_BASE;
let PROXY_PATH_PREFIX = new URL(FHIR_SERVER_BASE).pathname;
PROXY_PATH_PREFIX = PROXY_PATH_PREFIX.endsWith("/")
  ? PROXY_PATH_PREFIX
  : PROXY_PATH_PREFIX + "/";

async function onProxyReq(proxyReq, req, res) {
  const oldPath = proxyReq.path;
  proxyReq.path = req.adjustedPath
    ? PROXY_PATH_PREFIX + req.adjustedPath
    : proxyReq.path;
  logger.info(`proxy -> backend: was: ${oldPath}, is: ${proxyReq.path}`);
  proxyReq.setHeader("Authorization", "");
}

async function onProxyRes(proxyRes, req, res) {
  let rawBackendBody = Buffer.from([]);
  proxyRes.on("data", (data) => {
    rawBackendBody = Buffer.concat([rawBackendBody, data]);
  });

  proxyRes.on("end", async () => {
    const method = req.method;
    if (method === "GET") {
      processResponse(rawBackendBody, proxyRes, req, res);
    } else {
      sendIntactResponse(rawBackendBody, proxyRes, req, res);
    }
  });
}

function sendIntactResponse(rawBackendBody, proxyRes, req, res) {
  sendResponse(res, proxyRes.headers, proxyRes.statusCode, rawBackendBody);
  res.end();
}

async function processResponse(rawBackendBody, proxyRes, req, res) {
  try {
    if (responseIsError(proxyRes)) {
      sendResponse(res, proxyRes.headers, proxyRes.statusCode, rawBackendBody);
    } else {
      const parsedBackendResponse = parseResponseBody(
        rawBackendBody,
        proxyRes.headers
      );

      const modifiedResponse = await processFHIRResponse(
        req,
        parsedBackendResponse
      );
      sendJsonResponse(
        res,
        proxyRes.headers,
        proxyRes.statusCode,
        modifiedResponse
      );
    }
  } catch (e) {
    const errorResponse = proxyResponseExceptionResponse(e);
    sendJsonResponse(
      res,
      errorResponse.headers,
      errorResponse.status,
      errorResponse.body
    );
  } finally {
    res.end();
  }
}

module.exports = {
  onProxyRes,
  onProxyReq
};
