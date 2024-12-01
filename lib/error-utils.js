const logger = require("./logger");

function commonExceptions(e) {
  logger.debug(e);

  return e.error === "consent_deny"
    ? {
        status: 404,
        body: {
          message: "resource not found",
          error: "not found",
          status: 404
        }
      }
    : e.error === "token_error"
    ? {
        status: 403,
        body: {
          message:
            "must provide valid Bearer token in the Authorization header",
          error: "forbidden",
          status: 403
        }
      }
    : null;
}

function proxyResponseExceptionResponse(e) {
  return (
    commonExceptions(e) ||
    (e instanceof SyntaxError
      ? {
          status: 400,
          body: {
            message:
              "Invalid response from the backend FHIR server. LEAP FHIR-CES only supports JSON queries at this time.",
            error: "unsupported_response",
            status: 400
          }
        }
      : {
          status: 500,
          body: {
            message: "LEAP FHIR-CES encountered an internal error",
            error: "internal_error",
            status: 500
          }
        })
  );
}

module.exports = {
  proxyResponseExceptionResponse
};
