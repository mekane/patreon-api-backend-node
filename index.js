/**
 * This is "Main" where all of the modules are imported, configured, and tied together and the app is started.
 */
//const accessLogger = require('./accessLogger');
const PatreonApi = require('./src/PatreonApiInterface');
const fetchCommsModule = require('./src/fetchCommsApiModule');
const DataStore = require('./src/InMemoryDataStore');
const Policy = require('./src/Policy');
const server = require('./src/Server');

const config = require('./config.json');
const clientId = config.clientId || "";
const clientSecret = config.clientSecret || "";

const oauthRedirectPath = '/oauth/redirect';
//Note, the value of redirectUrl must match exactly with a value provided in the Patreon app web form
const redirectUrl = `http://${config.hostname}:${config.port}${oauthRedirectPath}`;

const patreonApi = PatreonApi(clientId, clientSecret, redirectUrl, fetchCommsModule);
const dataStore = DataStore();

const minimumPledgeCents = config.minimumPledgeCents || 500;
const policy = Policy({minimumPledgeCents});

const logger = require('node-file-logger');
logger.SetUserOptions({
    timeZone: 'Etc/UTC',
    folderPath: './logs/',
    dateBasedFileNaming: true,
    fileNamePrefix: 'Access_'
});

server.initialize(config.port, oauthRedirectPath, patreonApi, dataStore, policy, logger);
