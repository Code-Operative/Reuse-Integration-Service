const {test} = require('../queries/test');
const {getAuthToken} = require('../queries/tokens');

const testRoutes = [
    {
        method: 'GET',
        path: '/test/{sellerID}',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async(request)=> {
            const result = await getAuthToken(request.params.sellerID);

            return result;
        }
    },
]

module.exports = {
    testRoutes
}