const {_db} = require('./query');

const getAuthToken = async (sellerID) => {
    const db = await _db;
    const { DateTime } = require("luxon");

    const EbayAuthToken = require('ebay-oauth-nodejs-client');

    const ebayAuthToken = new EbayAuthToken({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        redirectUri: process.env.REDIRECT_URI
    });

    const possibleAccessToken = await db.tokens.findOne({
        seller_id: sellerID,
        token_type: "EBAY_AUTHORISATION"
    },
        {order: [{field: 'id', direction: 'desc'}]}
    );

    const tokenExpiry = DateTime.fromISO(possibleAccessToken.expiry_time.toISOString());

    let accessToken;

    if(DateTime.now() > tokenExpiry){ //if token has expired
        const refreshToken = await db.tokens.findOne({
            seller_id: sellerID,
            token_type: "EBAY_REFRESH"
        },
            {order: [{field: 'id', direction: 'desc'}]}
        );

        const scopes = "https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope%2Fsell.inventory%20https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope%2Fsell.account%20https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope%2Fcommerce.notification.subscription";

        let accessTokenResponse = await ebayAuthToken.getAccessToken('PRODUCTION', refreshToken.value, scopes);
        
        const tokens = await JSON.parse(accessTokenResponse);

        const lastToken = await db.tokens.findOne({}, {
            order: [{field: 'id', direction: 'desc'}]
        });
        
        const newTokenId = lastToken ? parseInt(lastToken.id) + 1 :  1;
    
        await db.tokens.insert({
            id: newTokenId,
            seller_id: sellerID,
            value: tokens.access_token,
            token_type: "EBAY_AUTHORISATION",
            expiry_time: DateTime.now().plus({hours: 2}).toISO(),
        });

        accessToken = tokens.access_token;
    }
    else{
        accessToken = possibleAccessToken.value;
    }

    return accessToken;
}

module.exports = {
    getAuthToken
}