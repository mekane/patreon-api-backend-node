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
                else {
                    console.log('  Got identity response for user ' + fullName);
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