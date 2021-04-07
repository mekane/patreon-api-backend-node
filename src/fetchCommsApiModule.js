/**
 * Implements communications with the Patreon API using the Node version of fetch
 * This module's only responsibility is to encapsulate the details of building the
 * URL's for the actual Patreon API and plumbing those through fetch.
 * All further handling (including errors) should be done in the PatreonApiInterface.
 * Note that this keeps the test mocks small and appropriately dumb.
 */

const fetch = require('node-fetch');
const formUrlEncode = require('form-urlencoded').default;
const url = require('url');

function getAccessToken(clientId, clientSecret, accessCode, redirectUrl) {
    const params = {
        client_id: clientId,
        client_secret: clientSecret,
        code: accessCode,
        grant_type: 'authorization_code',
        redirect_uri: redirectUrl
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Node 10'
        },
        body: formUrlEncode(params),
        params,
        credentials: 'include',
        compress: false
    };

    return fetch('https://www.patreon.com/api/oauth2/token', options)
        .then(response => response.json());
}

function getIdentity(accessToken) {
    const identityUrl = url.format({
        protocol: 'https',
        host: 'patreon.com',
        pathname: '/api/oauth2/v2/identity',
        query: {
            include: 'memberships.currently_entitled_tiers',
            'fields[user]': 'about,created,email,first_name,last_name',
            'fields[member]': 'full_name,email,patron_status,is_follower,pledge_relationship_start,lifetime_support_cents,currently_entitled_amount_cents,last_charge_date,last_charge_status,will_pay_amount_cents,pledge_cadence',
            'fields[tier]': 'amount_cents,title'
        }
    });

    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include'
    };

    return fetch(identityUrl, options)
        .then(response => response.json());
}

module.exports = {
    getAccessToken,
    getIdentity
};