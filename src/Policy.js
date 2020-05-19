const ERROR_INACTIVE = 'ERROR_INACTIVE';
const ERROR_INVALID = 'ERROR_INVALID';
const ERROR_INSUFFICIENT = 'ERROR_INSUFFICIENT';

const Policy = function (config) {
    const minimumPledge = config.minimumPledgeCents;

    function decideAccessByMembership(data) {
        if (data && data.membership && data.tier) {
            const membership = data.membership;
            const tier = data.tier;

            if (membership.patron_status === 'active_patron') {
                const currentPledgeAmount = membership.currently_entitled_amount_cents;

                if (currentPledgeAmount < minimumPledge)
                    return {
                        success: false,
                        errorType: ERROR_INSUFFICIENT
                    };
                else return {
                    success: true
                };
            }
            else return {
                success: false,
                errorType: ERROR_INACTIVE
            };
        }

        return {
            success: false,
            errorType: ERROR_INVALID
        };
    }

    return {
        ERROR_INACTIVE,
        ERROR_INVALID,
        ERROR_INSUFFICIENT,
        decideAccessByMembership
    }
}

module.exports = Policy;