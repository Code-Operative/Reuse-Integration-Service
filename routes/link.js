const {checkEbayLink, createEbayLink} = require('../queries/ebay');

const linkRoutes = [
    {
        method: 'GET',
        path: '/link/ebay/{sellerID}',
        config: {
            cors: true
            /*{
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }*/
        },
        handler: async(request)=> {
            const {sellerID} = request.params;

            const result = await checkEbayLink(sellerID);

            return result;
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
            const {sellerID, ebayOAuthCode} = request.payload;

            console.log(sellerID)
            console.log(ebayOAuthCode)

            const result = await createEbayLink(sellerID, ebayOAuthCode);

            console.log(result)

            return result;
        }
    },
    {
        method: 'POST',
        path: '/ebay/test',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async(request)=> {
            const {code} = request.payload;

            let result;

            const EbayAuthToken = require('ebay-oauth-nodejs-client');

            const ebayAuthToken = new EbayAuthToken({
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                redirectUri: process.env.REDIRECT_URI
            });

            console.log(ebayAuthToken);

            const token = await ebayAuthToken.getApplicationToken('PRODUCTION');
            console.log(token);

            const accessToken = await ebayAuthToken.exchangeCodeForAccessToken('PRODUCTION', code);
            console.log(accessToken);

            result = accessToken;

            return result;
        }
    },
    {
        method: 'POST',
        path: '/ebay/refresh',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async(request)=> {
            const {refreshToken} = request.payload;

            let result;

            const EbayAuthToken = require('ebay-oauth-nodejs-client');

            const ebayAuthToken = new EbayAuthToken({
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                redirectUri: process.env.REDIRECT_URI
            });

            const scopes = "https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope%2Fsell.inventory%20https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope%2Fsell.account";

            const accessToken = await ebayAuthToken.getAccessToken('PRODUCTION', refreshToken, scopes);
            console.log(accessToken);

            result = accessToken;

            return result;
        }
    },
];

module.exports = {
    linkRoutes
}