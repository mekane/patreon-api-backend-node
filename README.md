# Patreon API Backend for Node

This project is a Node server that protects a page by only serving it to users who log into Patreon and have an active
pledge tier of sufficient amount. It uses V2 of the Patreon API.

## Setup

  * `npm install`
  * Create a config.json (you can copy config.json.template) and fill in your values:
      * _client id_ and _secret_ values from the client entry on the "Clients and API Keys" page.
      * _minimumPledgeCents_ the number of cents that are required in a user's pledge tier to see the protected content. 
      * _hostname_ (e.g. "www.mydomain.com")
      * _port_ you want to listen on which is almost definitely going to be `80`
  * Run the server: `node index.js`

Raw request logs and some diagnostics are output to standard out. A daily-rotating log file will be written to logs/

Note that when the server starts up it logs the redirect URL included in the OAuth request. You can copy-paste that into
your Patreon client config section where you registered your application. 

## Features

 * Uses Express and Mustache for a lightweight and common server setup.
 * Data Access, Data Persistence, and Access Policy are injected into the server so they can be easily tested and
   swapped out for new implementations.

## Limitations

 * Currently only serves one protected route - "views/successPage.mustache". An enhancement would be to make the code
   that protects the current route into an Express middleware
 * Currently uses an in-memory data store so if the node process is restarted all sessions are lost and users will need
   to repeat the "connect to Patreon" OAuth process. Enhancement would be to use a simple flat-file database to save 
   the session data.
