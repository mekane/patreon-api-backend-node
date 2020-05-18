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

