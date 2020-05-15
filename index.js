/**
 * The server
 *
 */
const cookieParser = require('cookie-parser');
const express = require('express');
const url = require('url');
const fetch = require('node-fetch');
const formUrlEncode = require('form-urlencoded').default;

const app = express();
//const accessLogger = require('./accessLogger');
const port = 80;
const oauthRedirectPath = '/oauth/redirect';

//TODO: Read these values from environment or a config file (DON'T PUSH TO GITHUB WITH THIS REPO!)
//const clientId = process.env.PATREON_CLIENT_ID
const clientId = '7wL7w6W0MNfn98UUbTlY4daPYTdSrRMv657JUlnIseDP29iLCJ8XvDtZrTR-DOWG';
//const clientSecret = process.env.PATREON_CLIENT_SECRET
const clientSecret = 'cgQe0S-xT9aqi0iK2DsZzQiTBGefHO_OQaOkGKEMwrsVQQ-U6w8JiJo5f5jUC4UL';

const redirectUrl = `http://localhost:${port}${oauthRedirectPath}`;
const protectedRoute = '/app';

const patreonLoginUrl = url.format({
    protocol: 'https',
    host: 'patreon.com',
    pathname: '/oauth2/authorize',
    query: {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUrl,
        scope: 'identity',
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
    app.use(cookieParser());
    app.use(express.static('public'));
    app.engine('mustache', require('mustache-express')());
    app.set('view engine', 'mustache')
}

function setupRouting() {
    app.get('/', showLoginPage);
    app.get('/login', showLoginPage);
    app.get(oauthRedirectPath, handleOauthRedirectFromPatreon);
    app.get(protectedRoute, handleRequestForProtectedPage);
}

function handleOauthRedirectFromPatreon(req, res) {
    const code = req.query.code;
    console.log(`* Got OAuth redirect from Patreon ${code}`);

    requestAuthToken(code)
        .then(oauthResponse => {
            return requestIdentity(oauthResponse.access_token);
        })
        .then(memberData => {
            console.log('+++ Got Member Data from Patreon', memberData);

            //store user data in "database" TODO: use flat file so it persists between process restarts
            database[memberData.id] = {
                lastAccessCheck: Date.now(),
                memberData
            };

            //TODO: make this cookie expire at the same rate as the Patreon token
            res.cookie("id", memberData.id, {httpOnly: true});

            return res.redirect(protectedRoute);
        })
        .catch(err => {
            console.log('Error getting oauth token', err);
            //TODO: show "sorry page"
        });
}

function requestAuthToken(accessCode) {
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
}

function requestIdentity(accessToken) {
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
        });
}

function handleRequestForProtectedPage(req, res) {
    const cookies = req.cookies;

    console.log('*** =============== Begin Request For Calculator');

    if (cookies && cookies['id']) {
        const userId = cookies['id'];
        console.log(`  * Has Cookie: yes (id ${userId})`);

        const sessionData = database[userId];

        if (sessionData && sessionData.lastAccessCheck) {
            const memberData = sessionData.memberData || {};

            //TODO: check if last API call time is within threshhold
            const msElapsedSinceLastApiCheck = (Date.now() - sessionData.lastAccessCheck);
            console.log(`  * Has saved user data (name ${memberData.fullName})`);

            if (sessionData.lastAccessCheck) { //TODO: real check
                console.log(`  * Last API check ok (${msElapsedSinceLastApiCheck / 1000}s ago)`);

                if (memberData.tier) { //TODO: real check
                    console.log(`  * membership data and pledge tier is ok (tier ${memberData.tier.title})`);
                    //TODO: business logic to check if tier is good
                    //access checks
                    // user.patron_status = 'active patron'
                    // tier.title == 'Hard Coded Name'
                    // membership.currently_entitled_amount_cents >= tier.amount_cents;

                    return res.render('successPage', {name: memberData.fullName, title: 'Success'});
                }
                else {
                    console.log('  * Members pledge tier is not good enough');
                    return res.render('tierTooLow', {tierName: memberData.tier.title, title: 'Access Denied'});
                }
            }
            else {
                console.log('  * Need to update membership data from API');
                //TODO: logic to refresh tokens and then repeat this check
            }
        }
        else /*XXX*/ console.log('  * No user data: need to log in');
    }
    else /*XXX*/console.log('  * No Cookie: need to log in');

    return res.redirect('/login');
}

function startServer() {
    app.listen(port, () => console.log(`Patreon Backend app listening on port ${port}!`));
}

function showLoginPage(req, res) {
    const title = "Login with Patreon";
    res.render('loginPage', {title, patreonLoginUrl});
}