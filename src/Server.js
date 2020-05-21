const accessLogger = require('./accessLogger');
const crypto = require('crypto');
const express = require('express');

/**
 * The server exists to protect one or more routes and only serve content if the user is
 * a valid, active Patreon member with a pledge tier for the current campaign that meets
 * the minimum criteria to get access to the content at the path.
 *
 * It listens at oauthPath for responses from Patreon, which happen when a user clicks the
 * "login with Patreon" link and authorizes the app. It sends them back here. Assuming that
 * all went smoothly we get an access token that represents them to the Patreon API with
 * permission to query their public profile. We save this in a session, set a cookie in their
 * browser so we remember them later, and use the access token to query their Patreon user
 * information and membership data for the current campaign.
 *
 * After the initial connection described above they are redirected to the protected page.
 * This triggers the lookup and checks against their membership and pledge details. If
 * satisfactory they are allowed to see the page (i.e. it is rendered) otherwise we render
 * an error page.
 */
const sessionCookieName = 'id';
const protectedRoute = '/app';

let patreonApi;
let dataStore;
let policy;
let logger;

let initialized = false;

function initialize(port, oauthPath, injectedPatreonApi, injectedDataStore, injectedPolicy, injectedLogger) {
    if (initialized)
        throw new Error('Error server is already running!');

    patreonApi = injectedPatreonApi;
    dataStore = injectedDataStore;
    policy = injectedPolicy;
    logger = injectedLogger;

    const app = express();
    app.use(accessLogger);
    app.use(require('cookie-parser')());
    app.use(express.static('public'));
    app.engine('mustache', require('mustache-express')());
    app.set('view engine', 'mustache')
    app.set('trust proxy', true);

    // Setup Routing
    app.get('/', showLoginPage);
    app.get('/login', showLoginPage);
    app.get(oauthPath, handleOauthRedirectFromPatreon);
    app.get(protectedRoute, handleRequestForProtectedPage);

    // Start App
    app.listen(port, () => console.log(`Patreon Backend app listening on port ${port}!`));
    initialized = true;
}

// We tell Patreon to send the user here after they authorize the integration
function handleOauthRedirectFromPatreon(req, res) {
    const code = req.query.code;
    const userDeniedAuthorization = (typeof code === 'undefined');

    if (userDeniedAuthorization) {
        return showYouNeedToAuthorizePage();
    }

    console.log(`* Got OAuth response from Patreon ${code}`);

    patreonApi.getAccessToken(code)
        .then(saveAccessTokenInSession)
        .then(redirectToProtectedRoute)
        .catch(showOauthErrorPage)

    function showYouNeedToAuthorizePage() {
        console.log('* User denied authorization')
        //TODO: render a nicer "you need to authorize" page
        return res.send('<h1>You need to authorize the app to log into the calculator</h1>');
    }

    function saveAccessTokenInSession(oauthResponse) {
        const expiresIn = oauthResponse.expiresIn;
        const sessionData = oauthResponse.accessToken;

        const sessionKey = 'gdf' + crypto.randomBytes(20).toString('hex');

        dataStore.set(sessionKey, sessionData);
        res.cookie(sessionCookieName, sessionKey, {httpOnly: true, SameSite: 'Strict', 'Max-Age': expiresIn});
    }

    function redirectToProtectedRoute(_) {
        return res.redirect(protectedRoute);
    }

    function showOauthErrorPage(err) {
        console.log('Error getting oauth token', err);
        //TODO: show "sorry page"
    }
}

function handleRequestForProtectedPage(req, res) {
    console.log('*** =============== Begin Request For Calculator');

    // 1) Get cookie from session
    const sessionKey = getSessionKeyFromCookie();

    // 2) Get session data from dataStore based on cookie => login if no session for cookie or missing cookie
    const accessToken = getAccessKeyFromSessionData(sessionKey);

    // 3) Make Patreon API call using access token stored in session
    patreonApi.getIdentity(accessToken)
        .then(patreonUserData => {
            const action = policy.decideAccessByMembership(patreonUserData);

            console.log('  action', action);

            if (action.success) {
                logger.Info(`Successful access by ${patreonUserData.fullName}`, `Session ${sessionKey}`);
                return res.render('successPage', {name: patreonUserData.fullName, title: 'Success'});
            }
            else {
                switch (action.errorType) {
                    case policy.ERROR_INVALID:
                        //TODO: generate a unique code to log and report to user in this case
                        logger.Error(`Invalid user data ${JSON.stringify(patreonUserData)}`, `Session ${sessionKey}`);
                        return res.render('invalidDataError', {title: 'Patreon Data Error', reqestId: sessionKey});
                    case policy.ERROR_INACTIVE:
                        logger.Error(`User ${patreonUserData.fullName} denied access because they are inactive`, `Session ${sessionKey}`);
                        return res.render('inactivePledgeDenied', {title: 'Patreon User Inactive'});
                    case policy.ERROR_INSUFFICIENT:
                        logger.Error(`User ${patreonUserData.fullName} denied access because their pledge tier is too low ${JSON.stringify(patreonUserData.tier)}`, `Session ${sessionKey}`);
                        return res.render('insufficientPledgeDenied', {
                            title: 'Insufficient Pledge Tier',
                            tierName: patreonUserData.tier.title
                        });
                    default:
                        logger.Fatal(`This should not happen ${JSON.stringify(patreonUserData)}`, `Session ${sessionKey}`);
                }
            }
        })
        .catch(err => {
            logger.Error(`Error getting Patreon user data ${JSON.stringify(err)}`, `Session ${sessionKey}`);
            return res.render('invalidDataError', {title: 'Patreon Data Error', reqestId: sessionKey});
        });

    function getSessionKeyFromCookie() {
        const cookies = req.cookies;
        if (cookies && cookies[sessionCookieName])
            return cookies[sessionCookieName];
        return null;
    }

    function getAccessKeyFromSessionData(key) {
        return dataStore.get(sessionKey);
    }

    /*
        // TODO: work out a business logic module that can be injected with all this state and unit test the various cases
        if (memberData.tier) { //TODO: real check
            console.log(`  * membership data and pledge tier is ok (tier ${memberData.tier.title})`);
            //TODO: business logic to check if tier is good
            //access checks
            // user.patron_status = 'active patron'
            // tier.title == 'Hard Coded Name'
            // membership.currently_entitled_amount_cents >= tier.amount_cents;

            console.log('  * Members pledge tier is not good enough');
            return res.render('tierTooLow', {tierName: memberData.tier.title, title: 'Access Denied'});
        }
    */
}


function showLoginPage(req, res) {
    const title = "Login with Patreon";
    const patreonLoginUrl = patreonApi.getLoginUrl();

    res.render('loginPage', {title, patreonLoginUrl});
}

module.exports = {
    initialize
};