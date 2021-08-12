const {_db} = require('./query');

const checkEbayLink = async (sellerID) => {
    const db = await _db;
    const { DateTime } = require("luxon");

    const seller = await db.sellers.findOne({id: sellerID});

    if(!seller)
        return {success: false, message: "no seller with that ID registered"};
    
    //an ebay account exists if we have a way to generate tokens for one i.e. a valid refresh token
    const ebayRefreshToken = await db.tokens.findOne({
        seller_id: seller.id,
        token_type: "EBAY_REFRESH"
    },
        {order: [{field: 'id', direction: 'desc'}]}
    );

    if(!ebayRefreshToken)
        return {success: false, message: "no valid ebay token linked to that seller"};

    console.log(DateTime.now().toISO())
    console.log(typeof(ebayRefreshToken.expiry_time))
    console.log(DateTime.fromISO(ebayRefreshToken.expiry_time.toISOString()))
        
    if(DateTime.now().toISO() < ebayRefreshToken.expiry_time)
        return {success: true, message: "there is a valid ebay token linked to that seller"};
    else
        return {success: false, message: "there was a valid ebay token linked to that seller, but it expired"};
}

const createEbayLink = async (sellerID, ebayOAuthCode) => {
    const db = await _db;
    const { DateTime } = require("luxon");

    const EbayAuthToken = require('ebay-oauth-nodejs-client');

    const ebayAuthToken = new EbayAuthToken({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        redirectUri: process.env.REDIRECT_URI
    });

    const accessToken = await ebayAuthToken.exchangeCodeForAccessToken('PRODUCTION', ebayOAuthCode);
    const tokens = await JSON.parse(accessToken);

    let result = {};

    console.log(tokens)

    const seller = await db.sellers.findOne({id: sellerID});

    if(!seller){
        await db.sellers.insert({
            id: sellerID,
            name: "replace this name",
            email: "replace this email"
        });

        result.message = "seller created";
    }
    
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

    await db.tokens.insert({
        id: newTokenId + 1,
        seller_id: sellerID,
        value: tokens.refresh_token,
        token_type: "EBAY_REFRESH",
        expiry_time: DateTime.now().plus({years: 90}).toISO(),
    });

    result.success = true;
    
    if(result.message == "seller created")
        result.message = "seller and ebay tokens created";
    else
        result.message = "ebay tokens updated for seller";
    
    return result;
}

module.exports = {
    checkEbayLink,
    createEbayLink
}