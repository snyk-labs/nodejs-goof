const { continueVulnerableResponse } = require('./xssResponsePipeline');

function startVulnerableResponse(userInput, res) {
  continueVulnerableResponse({ userInput }, res);
}

module.exports = {
  startVulnerableResponse,
  continueVulnerableResponse
};
