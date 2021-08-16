const {checkForOrders} = require('../queries/check');

const routineRoutes = [
    {
        method: 'GET',
        path: '/routine/orders',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async()=> {

            let result;

            result = await checkForOrders();

            console.log(result)

            return result;
        }
    },
];

module.exports = {
    routineRoutes
}