const expect = require('chai').expect;

const mockComms = require('./mocks/mockCommsApiModule');
const PatreonApiInterface = require('../src/PatreonApiInterface');
const api = PatreonApiInterface('clientId', 'clientSecret', 'redirectUrl', mockComms);

describe('Getting Access Tokens', () => {
    it(`resolves to a result object with an access key and time-to-live`, () => {
        return api.getAccessToken('Access_Code_From_OAuth_Request')
            .then(result => {
                expect(result).to.be.an('object').with.keys(['accessToken', 'expiresIn']);
            });
    });

    it(`never reaches this code it the clientId is bad`, () => {
    });

    it(`resolves to bogus access object if the code is bogus`, () => {
        //this is identical to a successful response but the identity call will have bad data
        // (including the accessToken which will == the original bogus access code)
    });

    it(`resolves to an error object if something is wrong with the user account`, () => {
        //Not sure how to reproduce this in the real API to see what it does...
    });

    it(`resolves to an error object if something else is wrong with the request`, () => {
        return api.getAccessToken('FAIL')
            .then(result => {
                expect(result).to.be.an('object').with.keys(['errorCode', 'errorMessage', 'status']);
            });
    });

    it(`resolves to an error if something goes wrong that causes the request to reject`, () => {
        return api.getAccessToken('ERROR')
            .then(result => {
                expect(result).to.be.an('object').with.keys(['errorCode', 'errorMessage', 'status']);
            });
    });
});

describe('Getting user identity and membership data', () => {
    it(`resolves to a result object with expected properties`, () => {
        return api.getIdentity('usingValidAccessToken')
            .then(result => {
                expect(result).to.be.an('object').with.keys(['id', 'fullName', 'accessToken', 'membership', 'tier']);
            });
    });

    //TODO: error handling in API interface
    it(`resolves to a result with default values if membership or tier data is missing`);

    it(`resolves to an error if the access token wasn't good`);

    it('resolves to an error if user data is missing');

    it(`resolves to an error if something else went wrong`);

    it(`resolves to an error if something goes wrong that causes the request to reject`);
});

describe('Getting the Patreon login url', () => {
    it('uses injected values to build a login URL', () => {
        const expectedUrl = 'https://patreon.com/oauth2/authorize?response_type=code&client_id=clientId&redirect_uri=redirectUrl&scope=identity&state=chill';
        const actualUrl = api.getLoginUrl();

        expect(actualUrl).to.equal(expectedUrl);
    });
});

