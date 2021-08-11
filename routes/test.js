const {test} = require('../queries/test');

const testRoutes = [
    {
        method: 'GET',
        path: '/test',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async(request)=> {
            const result = await test();

            return result;
        }
    },
]

module.exports = {
    testRoutes
}