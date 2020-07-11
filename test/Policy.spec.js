const expect = require('chai').expect;

const magicUser = {fullName: 'Magic User'};

const Policy = require('../src/Policy');
const policy = Policy({minimumPledgeCents: 500, magicUsers: [magicUser.fullName]});

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

    it('returns an INACTIVE error if they are a Patreon user with no pledge', () => {
        const expectedError = {
            success: false,
            errorType: policy.ERROR_INACTIVE
        };

        expect(policy.decideAccessByMembership(nonPledgingPatreonUser)).to.deep.equal(expectedError);
        expect(policy.decideAccessByMembership(nonPledgingMember)).to.deep.equal(expectedError);
    });

    it('returns an INACTIVE error if the membership is not active', () => {
        const expectedError = {
            success: false,
            errorType: policy.ERROR_INACTIVE
        };

        expect(policy.decideAccessByMembership(inactiveMembership)).to.deep.equal(expectedError);
        expect(policy.decideAccessByMembership(formerMembership)).to.deep.equal(expectedError);
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

    it('always returns success if the fullName matches a magic user', () => {
        const nonPledge = Object.assign({}, nonPledgingPatreonUser, magicUser);
        const nonMember = Object.assign({}, nonPledgingMember, magicUser);
        const formerMember = Object.assign({}, formerMembership, magicUser);
        const inactiveMember = Object.assign({}, inactiveMembership, magicUser);
        const activeMember = Object.assign({}, activePledgeUserData, magicUser);
        const pledgingMember = Object.assign({}, sufficientPledgeUserData, magicUser);

        const success = {
            success: true
        };

        expect(policy.decideAccessByMembership(nonPledge)).to.deep.equal(success);
        expect(policy.decideAccessByMembership(nonMember)).to.deep.equal(success);
        expect(policy.decideAccessByMembership(formerMember)).to.deep.equal(success);
        expect(policy.decideAccessByMembership(inactiveMember)).to.deep.equal(success);
        expect(policy.decideAccessByMembership(activeMember)).to.deep.equal(success);
        expect(policy.decideAccessByMembership(pledgingMember)).to.deep.equal(success);

    });
});

/* Note that this is the form that it takes when coming back from the API Interface */

var nonPledgingPatreonUser = {
    id: '2002001',
    fullName: 'Marty Kane',
    accessToken: 'XX_NXX_BNxXxxxNxKxxKNNwXXxxXXXXxNxXNHHxxNxx'
}

var nonPledgingMember = {
    id: '2002001',
    fullName: 'Marty Kane',
    accessToken: 'XX_NXX_BNxXxxxNxKxxKNNwXXxxXXXXxNxXNHHxxNxx',
    membership: {
        id: 'something_weird',
        helpful: 'no_not_really'
    }
}

var formerMembership = {
    id: '2002001',
    fullName: 'Marty Kane',
    accessToken: 'XX_NXX_BNxXxxxNxKxxKNNwXXxxXXXXxNxXNHHxxNxx',
    membership: {
        currently_entitled_amount_cents: 0,
        full_name: "Marty Kane",
        is_follower: false,
        last_charge_date: "2020-06-01T22:09:48.000+00:00",
        last_charge_status: "Paid",
        lifetime_support_cents: 300,
        patron_status: "former_patron",
        pledge_relationship_start: "2020-07-11T03:26:00.481+00:00",
        will_pay_amount_cents: 0
    }
}

var inactiveMembership = {
    id: '2002001',
    fullName: 'Marty Kane',
    accessToken: 'XX_NXX_BNxXxxxNxKxxKNNwXXxxXXXXxNxXNHHxxNxx',
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
