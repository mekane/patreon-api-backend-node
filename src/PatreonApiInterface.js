const url = require('url');

/**
 * Exports a function that returns a new instance of the Patreon API Interface backed by the provided implementation.
 * This is to enable testing and to decouple the code that uses this interface from the implementation details.
 */
function PatreonApiInterface(clientId, clientSecret, redirectUrl, communicationModule) {
    const api = communicationModule;

    return {
        getAccessToken,
        getIdentity,
        getLoginUrl
    };

    function getAccessToken(accessCode) {
        return api.getAccessToken(clientId, clientSecret, accessCode, redirectUrl);
    }

    function getIdentity(accessToken) {
        return api.getIdentity(accessToken);
    }

    function getLoginUrl() {
        return url.format({
            protocol: 'https',
            host: 'patreon.com',
            pathname: '/oauth2/authorize',
            query: {
                response_type: 'code',
                client_id: clientId,
                redirect_uri: redirectUrl,
                scope: 'identity',
                state: 'chill' //TODO: generate something?
            }
        });
    }
}

module.exports = PatreonApiInterface;