/**
 * The server
 *
 */
const express = require('express');
const app = express();
//const accessLogger = require('./accessLogger');
const port = 443;

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
}

function startServer() {
    app.listen(port, () => console.log(`Patreon Backend app listening on port ${port}!`));
}

function showLoginPage(req, res) {
    res.render('loginPage', {title: "login"});
}