/**
 * The server
 *
 */
const express = require('express');
const url = require('url');
const fetch = require('node-fetch');
const formUrlEncode = require('form-urlencoded').default;

const app = express();
//const accessLogger = require('./accessLogger');
const port = 80;
const oauthRedirectPath = '/oauth/redirect';

//const clientId = process.env.PATREON_CLIENT_ID
const clientId = '7wL7w6W0MNfn98UUbTlY4daPYTdSrRMv657JUlnIseDP29iLCJ8XvDtZrTR-DOWG';
//const clientSecret = process.env.PATREON_CLIENT_SECRET
const clientSecret = 'cgQe0S-xT9aqi0iK2DsZzQiTBGefHO_OQaOkGKEMwrsVQQ-U6w8JiJo5f5jUC4UL';

const redirectUrl = `http://localhost:${port}${oauthRedirectPath}`;

const patreonLoginUrl = url.format({
    protocol: 'https',
    host: 'patreon.com',
    pathname: '/oauth2/authorize',
    query: {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUrl,
        scope: 'identity campaigns',
        state: 'chill'
    }
});

console.log(redirectUrl);

let database = {};

initialConfiguration();
setupRouting();
startServer();

function initialConfiguration() {
    //app.use(bodyParser.json());
    //app.use(accessLogger);
    app.use(express.static('public'));
    app.engine('mustache', require('mustache-express')());
    app.set('view engine', 'mustache')
}

function setupRouting() {
    app.get('/', showLoginPage);
    app.get('/login', showLoginPage);
    app.get(oauthRedirectPath, handleOauthRedirectFromPatreon);
    app.get('/protected/:id', handleLoggedIntoProtectedPage);
}

function handleOauthRedirectFromPatreon(req, res) {
    console.log("Handle OAuth Redirect");
    console.log(req.query);
    console.log("------------------------------------------------------------------------");

    const code = req.query.code;

    const params = {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
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
        .then(({access_token}) => {
            console.log('+++ got token response', access_token);
            return requestIdentity(access_token);
        });
}

function requestIdentity(accessToken) {
    const identityUrl = url.format({
        protocol: 'https',
        host: 'patreon.com',
        pathname: '/api/oauth2/v2/identity',
        query: {
            include: 'memberships',
            'fields[user]': 'about,created,email,first_name,last_name',
            'fields[member]': 'patron_status,is_follower,full_name,email,pledge_relationship_start,lifetime_support_cents,currently_entitled_amount_cents,last_charge_date,last_charge_status,will_pay_amount_cents'
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
            console.dir(json, {depth: null})
            console.log('================================================================');

            const userData = json.data.attributes;
            const userName = userData.first_name + ' ' + userData.last_name;

            console.log('Got identity response ' + userName);

            const membership = (json.included || []).filter(o => o.type === 'member')[0];
            console.log('Got membership ' + membership.id);

            return getMembershipData(membership.id);
        });

    function getMembershipData(membershipId) {
        const membershipUrl = url.format({
            protocol: 'https',
            host: 'patreon.com',
            pathname: '/api/oauth2/v2/members/' + membershipId,
            query: {
                include: 'currently_entitled_tiers',
                'fields[member]': 'full_name',
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

        console.log('membership request ' + membershipUrl);

        return fetch(membershipUrl, options)
            .then(response => response.json())
            .then(json => {
                console.log('Got membership response');
                console.dir(json, {depth: null});
            });
    }
}


function handleLoggedIntoProtectedPage(req, res) {
    const {id} = req.params

    // load the user from the database
    const user = database[id]
    if (!user || !user.token) {
        return res.redirect('/')
    }

    const apiClient = patreon(user.token);

    // make api requests concurrently
    return apiClient('/current_user/campaigns')
        .then(({store}) => {
            const _user = store.find('user', id)
            const campaign = _user.campaign ? _user.campaign.serialize().data : null;

            console.log(JSON.stringify(campaign));

            return res.send('<pre>' + JSON.stringify(campaign) + '</pre>');
        }).catch((err) => {
            const {status, statusText} = err
            console.log('Failed to retrieve campaign info')
            console.log(err)
            return res.json({status, statusText})
        });
}

function startServer() {
    app.listen(port, () => console.log(`Patreon Backend app listening on port ${port}!`));
}

function showLoginPage(req, res) {
    const title = "Login with Patreon";
    res.render('loginPage', {title, patreonLoginUrl});
}