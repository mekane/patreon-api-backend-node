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
const protectedRoute = '/app';

let patreonApi;
let dataStore;

let initialized = false;

function initialize(port, oauthPath, injectedPatreonApi, injectedDataStore) {
    if (initialized)
        throw new Error('Error server is already running!');

    patreonApi = injectedPatreonApi;
    dataStore = injectedDataStore;

    const app = express();
    //app.use(accessLogger);
    app.use(require('cookie-parser')());
    app.use(express.static('public'));
    app.engine('mustache', require('mustache-express')());
    app.set('view engine', 'mustache')

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
        console.log('* User denied authorization')
        //TODO: render a nicer "you need to authorize" page
        return res.send('<h1>You need to authorize the app to log into the calculator</h1>');
    }

    console.log(`* Got OAuth redirect from Patreon ${code}`);

    patreonApi.getAccessToken(code)
        .then(oauthResponse => {
            const expiresIn = oauthResponse.expiresIn;
            const accessToken = oauthResponse.accessToken;

            console.log(`  - token expires in ${expiresIn / 86400} days`);

            return patreonApi.getIdentity(accessToken); //TODO: we actually just need to store the accessToken and then redirect to protected route

        })
        .then(memberData => {
            console.log('+++ Got Member Data from Patreon', memberData);

            const sessionData = {
                lastAccessCheck: Date.now(), //TODO: move this to the cache in the patreonApi module
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

    // 1) Get cookie from session
    // 2) Get session data from dataStore based on cookie => login if no session for cookie or missing cookie
    // 3) Make Patreon API call using access token stored in session
    // 4) Pass that data into the business rules module
    // 5) Render appropriate response based on return from logic module


    // TODO: work out a business logic module that can be injected with all this state and unit test the various cases

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


function showLoginPage(req, res) {
    const title = "Login with Patreon";
    const patreonLoginUrl = patreonApi.getLoginUrl();

    res.render('loginPage', {title, patreonLoginUrl});
}

module.exports = {
    initialize
};