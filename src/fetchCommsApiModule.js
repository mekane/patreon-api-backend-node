/**
 * Implements communications with the Patreon API using the Node version of fetch
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
        .then(response => response.json())
        .catch(err => {
            //TODO: handle error in token request
        });
}

function getIdentity(accessToken) {
    const identityUrl = url.format({
        protocol: 'https',
        host: 'patreon.com',
        pathname: '/api/oauth2/v2/identity',
        query: {
            include: 'memberships.currently_entitled_tiers',
            'fields[user]': 'about,created,email,first_name,last_name',
            'fields[member]': 'patron_status,is_follower,full_name,email,pledge_relationship_start,lifetime_support_cents,currently_entitled_amount_cents,last_charge_date,last_charge_status,will_pay_amount_cents',
            'fields[tier]': 'description,title,amount_cents'
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
        .then(response => response.json())
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

module.exports = {
    getAccessToken,
    getIdentity
};