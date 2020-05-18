/**
 * The server
 *
 */
const cookieParser = require('cookie-parser');
const express = require('express');

const app = express();
//const accessLogger = require('./accessLogger');
const port = 80;
const oauthRedirectPath = '/oauth/redirect';
const redirectUrl = `http://localhost:${port}${oauthRedirectPath}`;

//TODO: Read these values from environment or a config file (DON'T PUSH TO GITHUB WITH THIS REPO!)
//const clientId = process.env.PATREON_CLIENT_ID
const clientId = '7wL7w6W0MNfn98UUbTlY4daPYTdSrRMv657JUlnIseDP29iLCJ8XvDtZrTR-DOWG';
//const clientSecret = process.env.PATREON_CLIENT_SECRET
const clientSecret = 'cgQe0S-xT9aqi0iK2DsZzQiTBGefHO_OQaOkGKEMwrsVQQ-U6w8JiJo5f5jUC4UL';

const protectedRoute = '/app';

const PatreonApi = require('./src/PatreonApiInterface');
const fetchCommsModule = require('./src/fetchCommsApiModule');
const patreonApi = PatreonApi(clientId, clientSecret, redirectUrl, fetchCommsModule);

const dataStore = require('./src/InMemoryDataStore')();

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

    patreonApi.getAccessToken(code)
        .then(oauthResponse => {
            const expiresIn = oauthResponse.expiresIn;
            const accessToken = oauthResponse.accessToken;

            console.log(`  - token expires in ${expiresIn / 86400} days`);

            return patreonApi.getIdentity(accessToken);
        })
        .then(memberData => {
            console.log('+++ Got Member Data from Patreon', memberData);

            const sessionData = {
                lastAccessCheck: Date.now(),
                memberData
            }

            //store session data in data store TODO: use flat file so it persists between process restarts
            dataStore.set(memberData.id, sessionData);

            //TODO: make this cookie expire at the same rate as the Patreon token
            res.cookie("id", memberData.id, {httpOnly: true});

            return res.redirect(protectedRoute);
        })
        .catch(err => {
            console.log('Error getting oauth token', err);
            //TODO: show "sorry page"
        });
}

function handleRequestForProtectedPage(req, res) {
    const cookies = req.cookies;

    console.log('*** =============== Begin Request For Calculator');

    if (cookies && cookies['id']) {
        const sessionKey = cookies['id'];
        console.log(`  * Has Cookie: yes (session key ${sessionKey})`);

        const sessionData = dataStore.get(sessionKey);

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
    const patreonLoginUrl = patreonApi.getLoginUrl();

    res.render('loginPage', {title, patreonLoginUrl});
}