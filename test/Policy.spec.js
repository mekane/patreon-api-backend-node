const expect = require('chai').expect;

const Policy = require('../src/Policy');
const policy = Policy({minimumPledgeCents: 500});

describe('Error types', () => {
    it('defines constants for error types', () => {
        expect(policy.ERROR_INVALID).to.exist;
        expect(policy.ERROR_INACTIVE).to.exist;
        expect(policy.ERROR_INSUFFICIENT).to.exist;
    });
});

describe('Action decisions based on the membership data', () => {
    it('returns an INVALID error if the data is malformed', () => {
        const expectedError = {
            success: false,
            errorType: policy.ERROR_INVALID
        };

        expect(policy.decideAccessByMembership()).to.deep.equal(expectedError);
        expect(policy.decideAccessByMembership({})).to.deep.equal(expectedError);
        expect(policy.decideAccessByMembership({membership: {}})).to.deep.equal(expectedError);
        expect(policy.decideAccessByMembership({tier: {}})).to.deep.equal(expectedError);
    });

    it('returns an INACTIVE error if the membership is not active', () => {
        const expectedError = {
            success: false,
            errorType: policy.ERROR_INACTIVE
        };

        expect(policy.decideAccessByMembership(inactiveMembership)).to.deep.equal(expectedError);
    });

    it(`returns an INSUFFICIENT error if the pledge amount doesn't meet the minimum`, () => {
        const expectedError = {
            success: false,
            errorType: policy.ERROR_INSUFFICIENT
        };
        expect(policy.decideAccessByMembership(activePledgeUserData)).to.deep.equal(expectedError);
    });

    it('returns success if the member is active and has a high enough pledge', () => {
        const expectedResponse = {
            success: true
        };
        expect(policy.decideAccessByMembership(sufficientPledgeUserData)).to.deep.equal(expectedResponse);
    });
});

/* Note that this is the form that it takes when coming back from the API Interface */
var inactiveMembership = {
    id: '2002001',
    fullName: 'Marty Kane',
    membership: {
        patron_status: 'something_else'
    },
    tier: {
        amount_cents: 300,
        description: 'Tier 1',
        title: 'Tier 1'
    }
};

var activePledgeUserData = {
    id: '2002001',
    fullName: 'Marty Kane',
    accessToken: 'XX_NXX_BNxXxxxNxKxxKNNwXXxxXXXXxNxXNHHxxNxx',
    membership: {
        currently_entitled_amount_cents: 300,
        full_name: 'Marty Kane',
        is_follower: false,
        last_charge_date: null,
        last_charge_status: null,
        lifetime_support_cents: 0,
        patron_status: 'active_patron',
        pledge_relationship_start: '2020-05-15T02:57:13.881+00:00',
        will_pay_amount_cents: 300
    },
    tier: {
        amount_cents: 300,
        description: 'Tier 1',
        title: 'Tier 1'
    }
};

var sufficientPledgeUserData = {
    id: '2002001',
    fullName: 'Marty Kane',
    accessToken: 'XX_NXX_BNxXxxxNxKxxKNNwXXxxXXXXxNxXNHHxxNxx',
    membership: {
        currently_entitled_amount_cents: 500,
        full_name: 'Marty Kane',
        is_follower: false,
        last_charge_date: null,
        last_charge_status: null,
        lifetime_support_cents: 0,
        patron_status: 'active_patron',
        pledge_relationship_start: '2020-05-15T02:57:13.881+00:00',
        will_pay_amount_cents: 500
    },
    tier: {
        amount_cents: 500,
        description: 'Tier 2',
        title: 'Tier 2'
    }
};
