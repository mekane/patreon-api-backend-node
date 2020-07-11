const ERROR_INACTIVE = 'ERROR_INACTIVE';
const ERROR_INVALID = 'ERROR_INVALID';
const ERROR_INSUFFICIENT = 'ERROR_INSUFFICIENT';

const Policy = function(config = {}) {
    const minimumPledge = config.minimumPledgeCents;
    const magicUsers = config.magicUsers || [];

    function decideAccessByMembership(data) {
        if (data && data.id && data.fullName && data.accessToken) {
            if (magicUsers.some(name => name === data.fullName)) {
                return {success: true}
            }

            if (data.membership) {
                const membership = data.membership;

                if (membership.patron_status === 'active_patron') {
                    const currentPledgeAmount = membership.currently_entitled_amount_cents;

                    if (currentPledgeAmount >= minimumPledge) {
                        return {success: true};
                    }
                    return {
                        success: false,
                        errorType: ERROR_INSUFFICIENT
                    };
                }
                return {
                    success: false,
                    errorType: ERROR_INACTIVE
                };
            }
            return {
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
