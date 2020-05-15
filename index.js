/**
 * The server
 *
 */
const express = require('express');
const patreon = require('patreon');
const url = require('url');

const app = express();
//const accessLogger = require('./accessLogger');
const port = 80;
const oauthRedirectPath = '/oauth/redirect';

//const clientId = process.env.PATREON_CLIENT_ID
const clientId = '7wL7w6W0MNfn98UUbTlY4daPYTdSrRMv657JUlnIseDP29iLCJ8XvDtZrTR-DOWG';
//const clientSecret = process.env.PATREON_CLIENT_SECRET
const clientSecret = 'cgQe0S-xT9aqi0iK2DsZzQiTBGefHO_OQaOkGKEMwrsVQQ-U6w8JiJo5f5jUC4UL';

const redirectUrl = `http://localhost:${port}${oauthRedirectPath}`;

const patreonAPI = patreon.patreon;
const patreonOAuth = patreon.oauth;
const patreonOAuthClient = patreonOAuth(clientId, clientSecret);

const patreonLoginUrl = url.format({
    protocol: 'https',
    host: 'patreon.com',
    pathname: '/oauth2/authorize',
    query: {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUrl,
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

    const {code} = req.query;
    let token;

    return patreonOAuthClient.getTokens(code, redirectUrl)
        .then(({access_token}) => {
            token = access_token
            const apiClient = patreonAPI(token)
            return apiClient('/current_user')
        })
        .then(({store, rawJson}) => {
            const {id} = rawJson.data
            database[id] = {...rawJson.data, token}
            console.log(`Saved user ${store.find('user', id).full_name} to the database`)
            return res.redirect(`/protected/${id}`)
        })
        .catch((err) => {
            console.log(err);
            console.log('Redirecting to login')
            //res.redirect('/')
            res.send(err);
        });
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