/**
 * Exports the same methods with the same signatures as the fetchCommsApiModule
 * But doesn't do any http calls, just returns hard-coded values. For testing.
 */

function getAccessToken(clientId, clientSecret, accessCode, redirectUrl) {
    if (accessCode === 'FAIL')
        return Promise.resolve({
            errors: [{
                code: 1,
                code_name: 'NotFound',
                detail: 'The requested URL was not found on the server.',
                id: 'NNxxNNNx-NxNN-NNNx-NNNx-xNNxNNNNNNNx',
                status: '404',
                title: 'Not Found'
            }]
        });

    if (accessCode === 'ERROR')
        return Promise.reject('something horrible happened in the network');

    return Promise.resolve({
        access_token: 'XX_NXX_BNxXxxxNxKxxKNNwXXxxXXXXxNxXNHHxxNxx',
        expires_in: 2678400,
        token_type: 'Bearer',
        scope: 'identity',
        refresh_token: 'xXNXXXXxXNNXxxXxxXxxxxNxXNXXXxxXXXxXxXXXxxY',
        version: '0.0.1'
    });
}

function getIdentity(accessToken) {
    return Promise.resolve({});
}

module.exports = {
    getAccessToken,
    getIdentity
};

/**/
const invalidClientId = {
    "error": "invalid_request",
    "error_description": "Invalid client_id parameter value.",
    "state": "chill"
}
