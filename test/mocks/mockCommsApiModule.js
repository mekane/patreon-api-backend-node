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
    return Promise.resolve({
        data: {
            attributes: {
                about: '',
                created: '2020-01-01T01:01:01.000+00:00',
                first_name: 'Marty',
                last_name: 'Kane'
            },
            id: '2002001',
            relationships: {
                memberships: {
                    data: [
                        {id: '0x0x8xN0-NNNx-NNxN-xxNx-xNxxNNNNNxxx', type: 'member'}
                    ]
                }
            },
            type: 'user'
        },
        included: [
            {
                attributes: {
                    currently_entitled_amount_cents: 300,
                    full_name: 'Marty Kane',
                    is_follower: false,
                    last_charge_date: null,
                    last_charge_status: null,
                    lifetime_support_cents: 0,
                    patron_status: 'active_patron',
                    pledge_relationship_start: '2020-05-15T02:57:13.881+00:00',
                    will_pay_amount_cents: 300
                },
                id: '0x0x8xN0-NNNx-NNxN-xxNx-xNxxNNNNNxxx',
                relationships: {currently_entitled_tiers: {data: [{id: '5550500', type: 'tier'}]}},
                type: 'member'
            },
            {
                attributes: {
                    amount_cents: 300,
                    description: 'Tier One',
                    title: 'Tier 1 - Backer'
                },
                id: '5550500',
                type: 'tier'
            }
        ],
        links: {
            self: 'https://www.patreon.com/api/oauth2/v2/user/2466753'
        }
    });
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
