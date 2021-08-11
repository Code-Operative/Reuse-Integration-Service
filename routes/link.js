const {checkEbayLink, createEbayLink} = require('../queries/ebay');


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

            const result = await checkEbayLink(email);

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
            const {sellerInfo, ebayInfo} = request.payload;

            let result;

            let seller = await getSeller(sellerInfo);
            if(!seller)
                seller = await createSeller(sellerInfo);

            let ebayAccount = await getEbayAccount(ebayInfo);
            if(!ebayAccount)
               result = await createEbayAccount(ebayInfo, sellerInfo);
            else
                result = {success: false, message: "ebay account already linked to this seller"};

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