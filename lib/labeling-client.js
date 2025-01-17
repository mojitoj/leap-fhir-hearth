const request = require("superagent");
const SLS_ENDPOINT = process.env.SLS_ENDPOINT;

async function label(resource) {
  try {
    const response = await request
      .post(SLS_ENDPOINT)
      .set("Accept", "application/json")
      .send(resource);

    return response.body;
  } catch (e) {
    console.log(e)
    logger.warn(`SLS invocation failed: ${e}`);
    throw {
        error: "internal_error",
        status: 500
    };
  }
}

module.exports = {
  label
};
