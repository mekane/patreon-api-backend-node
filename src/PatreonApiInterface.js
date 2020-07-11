const url = require('url');

/**
 * Exports a factory function that returns a new instance of the Patreon API Interface backed by a communication module.
 * This is to enable testing and to decouple the code that uses this interface from the implementation details.
 * This matters because there is some logic to do on this side, and we want to test that we handle things
 * correctly based on how the network responds without having to do actual network calls in our tests.
 */
function PatreonApiInterface(clientId, clientSecret, redirectUrl, communicationModule) {
    const api = communicationModule;

    return {
        getAccessToken,
        getIdentity,
        getLoginUrl
    };

    function getAccessToken(accessCode) {
        return api.getAccessToken(clientId, clientSecret, accessCode, redirectUrl)
            .then(json => {
                if (json.errors) {
                    console.log('OAuth Access Token Request Had Errors', json);
                    return {
                        errorCode: json.errors[0].code,
                        errorMessage: json.errors[0].detail,
                        status: json.errors[0].status
                    };
                }

                return {
                    accessToken: json.access_token,
                    expiresIn: json.expires_in
                };
            })
            .catch(err => {
                console.log('OAuth Access Token Request Failed', err);
                return {
                    errorCode: 0,
                    errorMessage: err,
                    status: 0
                };
            });
    }

    function getIdentity(accessToken) {
        return api.getIdentity(accessToken)
            .then(json => {
                //console.dir(json, {depth: null})

                const data = json.data || {};
                const userData = data.attributes || {};
                const fullName = userData.first_name + ' ' + userData.last_name;

                if (typeof data.id !== 'string') {
                    console.log('Warning, got bad Identity response', data);
                    // TODO: handle bad id response case(s)
                }

                const otherData = (json['included'] || []);
                const membership = otherData.filter(o => o.type === 'member')[0] || {};
                const tier = otherData.filter(o => o.type === 'tier')[0] || {};

                return {
                    id: data.id,
                    fullName,
                    accessToken,
                    membership: membership.attributes,
                    tier: tier.attributes
                };
            })
            .catch(err => {
                //TODO: handle error in response
            });
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
