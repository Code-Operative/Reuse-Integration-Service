const linkRoutes = [
    {
        method: 'GET',
        path: '/link/ebay/{email}',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async(request)=> {
            const {email} = request.params;

            return email;
        }
    },
    {
        method: 'POST',
        path: '/link/ebay',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async(request)=> {
            const {reuseAccount, ebayAccount} = request.payload;

            return true;
        }
    },
];

module.exports = {
    linkRoutes
}