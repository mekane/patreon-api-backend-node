
//const accessLogger = require('./accessLogger');

//Note, the value of redirectUrl must match exactly with a value provided in the Patreon app web form
const port = 80;
const oauthRedirectPath = '/oauth/redirect';
const redirectUrl = `http://localhost:${port}${oauthRedirectPath}`;

//TODO: Read these values from environment or a config file (DON'T PUSH TO GITHUB WITH THIS REPO!)
//const clientId = process.env.PATREON_CLIENT_ID
const clientId = '7wL7w6W0MNfn98UUbTlY4daPYTdSrRMv657JUlnIseDP29iLCJ8XvDtZrTR-DOWG';
//const clientSecret = process.env.PATREON_CLIENT_SECRET
const clientSecret = 'cgQe0S-xT9aqi0iK2DsZzQiTBGefHO_OQaOkGKEMwrsVQQ-U6w8JiJo5f5jUC4UL';

const PatreonApi = require('./src/PatreonApiInterface');
const fetchCommsModule = require('./src/fetchCommsApiModule');
const patreonApi = PatreonApi(clientId, clientSecret, redirectUrl, fetchCommsModule);

const dataStore = require('./src/InMemoryDataStore')();

const server = require('./src/Server');
server.initialize(port, oauthRedirectPath, patreonApi, dataStore);
