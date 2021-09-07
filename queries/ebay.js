const {_db} = require('./query');
const {getAuthToken} = require('./tokens');
const { 
    createEbayPaymentPolicy, 
    createEbayFulfillmentPolicy, 
    createEbayReturnPolicy,
    getPaymentPolicies,
    getFulfillmentPolicies,
    getReturnPolicies
} = require('./ebayPolicy');
const { createLocation, getLocations } = require('./location');

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

    const tokenExpiry = DateTime.fromISO(ebayRefreshToken.expiry_time.toISOString());
        
    if(DateTime.now() < tokenExpiry)
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

    const sellerResponse = await fetch(`${process.env.REUSE_URL}/api/kbsellers/${sellerID}?output_format=JSON`,{
        headers: {
            "Authorization": "Basic " + process.env.REUSE_API_KEY,
        }
    });
    const sellerData = await sellerResponse.json();

    //if there's no merchant location, create one
    const {locations} = await getLocations(tokens.access_token);
    if(!locations.length > 0)
        await createLocation(tokens.access_token,sellerData.seller); 
    
    //if there's no fulfillment policy, create one
    const {fulfillmentPolicies} = await getFulfillmentPolicies(tokens.access_token) ;
    if(!fulfillmentPolicies.length > 0)
        await createEbayFulfillmentPolicy(tokens.access_token);

    //if there's no payment policy, create one
    const {paymentPolicies} = await getPaymentPolicies(tokens.access_token);
    if(!paymentPolicies.length > 0)
        await createEbayPaymentPolicy(tokens.access_token);

    //if there's no return policy, create one
    const {returnPolicies} = await getReturnPolicies(tokens.access_token);
    if(!returnPolicies.length > 0)
        await createEbayReturnPolicy(tokens.access_token);
    
    return result;
}

const createEbayProduct = async (sellerID, productReference) => {
    const db = await _db;
    const fetch = require("node-fetch");

    console.log(sellerID)
    console.log(productReference)

    //using the sellerID, make calls to the prestashop web service to get the product ID, 
    //checking against the product reference

    const sellerResponse = await fetch(`${process.env.REUSE_URL}/api/kbsellers/${sellerID}?output_format=JSON`,{
        headers: {
          "Authorization": "Basic " + process.env.REUSE_API_KEY,
        }
    });
    
    const sellerData = await sellerResponse.json();
    const kbProducts = sellerData.seller.associations.kbsellerproducts;

    let matchingProduct;

    for(let i = 1;i <= kbProducts.length;i++){
        const kbProduct = kbProducts[kbProducts.length - i]; //iterate from the end of the array, where the most recent products are

        const kbProductResponse = await fetch(`${process.env.REUSE_URL}/api/kbsellerproducts/${kbProduct.id}?output_format=JSON`,{
            headers: {
              "Authorization": "Basic " + process.env.REUSE_API_KEY,
            }
        });
        const kbProductData = await kbProductResponse.json();
        const productID = kbProductData.kbsellerproduct.id_product;

        console.log(kbProductData);

        const productResponse = await fetch(`${process.env.REUSE_URL}/api/products/${productID}?output_format=JSON`,{
            headers: {
              "Authorization": "Basic " + process.env.REUSE_API_KEY,
            }
        });
        const productData = await productResponse.json();

        console.log(productData)

        //fetch the quantity available
        const stockID = productData.product.associations.stock_availables[0].id;

        const stockResponse = await fetch(`${process.env.REUSE_URL}/api/stock_availables/${stockID}?output_format=JSON`,{
            headers: {
                "Authorization": "Basic " + process.env.REUSE_API_KEY,
            }
        });
        const stockData = await stockResponse.json()

        quantityOnReuse = stockData.stock_available.quantity;

        if(productData.product.reference == productReference){
            matchingProduct = productData.product;
            matchingProduct.available_for_order = quantityOnReuse;
            break;
        }
    }

    if(!matchingProduct)
        return {success: false, message: "no product that matches that reference"};

    let imageUrl;
    if(matchingProduct.id_default_image){
        let imageID = matchingProduct.id_default_image;
        imageUrl = `https://reuse-home-integration-service.herokuapp.com/image/${matchingProduct.id}/${imageID}`
    }

    //check the items db, to see if we have it already
    const item = await db.items.findOne({id: matchingProduct.id});
    
    //if we do, update the product
    if(item){
        await db.items.update({id: matchingProduct.id},{
            reference: matchingProduct.reference,
            seller_id: sellerID,
            quantity: matchingProduct.available_for_order
        })
    } //if not, store it and get ready to post
    else{
        await db.items.insert({
            id: matchingProduct.id,
            reference: matchingProduct.reference,
            seller_id: sellerID,
            quantity: matchingProduct.available_for_order
        })
    }

    const authToken = await getAuthToken(sellerID);
      
    let merchantLocationKey;

    //get location, if none create one   

    const {locations} = await getLocations(authToken);

    if(locations.length > 0)
        merchantLocationKey = locations[0].merchantLocationKey;
    else
        merchantLocationKey = await createLocation(authToken,sellerData.seller);
    
    //get fulfillment policy, if none create one
    let fulfillmentPolicyId;

    const {fulfillmentPolicies} = await getFulfillmentPolicies(authToken) ;

    if(fulfillmentPolicies.length > 0)
        fulfillmentPolicyId = fulfillmentPolicies[0].fulfillmentPolicyId;
    else
        fulfillmentPolicyId = await createEbayFulfillmentPolicy(authToken);

    //get payment policy, if none create one
    let paymentPolicyId;

    const {paymentPolicies} = await getPaymentPolicies(authToken);

    if(paymentPolicies.length > 0)
        paymentPolicyId = paymentPolicies[0].paymentPolicyId;
    else
        paymentPolicyId = await createEbayPaymentPolicy(authToken);

    //get returns policy, if none create one
    let returnPolicyId;

    const {returnPolicies} = await getReturnPolicies(authToken);

    if(returnPolicies.length > 0)
        returnPolicyId = returnPolicies[0].returnPolicyId;
    else
        returnPolicyId = await createEbayReturnPolicy(authToken);

    //create inventory item

    const inventoryResponse = await fetch(`https://api.ebay.com/sell/inventory/v1/inventory_item/${productReference}`,{
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Content-Language": "en-GB",
            "Authorization": "Bearer " + authToken
        },
        body: JSON.stringify({
            availability: {
                shipToLocationAvailability: {
                    quantity: matchingProduct.available_for_order
                }
            },
            condition: "NEW",
            product: {
                title: matchingProduct.name,
                description: matchingProduct.description ? matchingProduct.description : "no description",
                aspects: {
                    Brand: [
                        "No brand"
                    ],
                    Type: [
                        "No type"
                    ],
                },
                imageUrls: [
                    imageUrl? imageUrl :`${process.env.REUSE_URL}/img/p/gb-default-large_default.jpg`
                ]
            }
        })
    })

    let inventoryData;
    if(inventoryResponse.status == 204)
        inventoryData = "everything's fine";
    else
        inventoryData = await inventoryResponse.json();

    console.log(inventoryData);
    
    //create offer or update offer actually, depending on if there is one for this item id

    let offerURL = `https://api.ebay.com/sell/inventory/v1/offer/`;
    let offerMethod = "POST";

    const offer = await db.ebay_items.findOne({id: matchingProduct.id});

    console.log(offer)

    if(offer){
        offerURL = `https://api.ebay.com/sell/inventory/v1/offer/${offer.offer_id}`;
        offerMethod = "PUT";
    }
    
    const offerResponse = await fetch(offerURL,{
        method: offerMethod,
        headers: {
            "Content-Type": "application/json",
            "Content-Language": "en-GB",
            "Authorization": "Bearer " + authToken
        },
        body: JSON.stringify({
            sku: productReference,
            marketplaceId: "EBAY_GB",
            format: "FIXED_PRICE",
            availableQuantity: matchingProduct.available_for_order,
            categoryId: "54235",
            listingDescription: matchingProduct.description ? matchingProduct.description : "no description",
            merchantLocationKey: merchantLocationKey,
            pricingSummary: {
                price: {
                    currency: "GBP",
                    value: matchingProduct.price
                }
            },
            listingPolicies: {
                fulfillmentPolicyId: fulfillmentPolicyId,
                paymentPolicyId: paymentPolicyId,
                returnPolicyId: returnPolicyId
            },
            includeCatalogProductDetails: true
        })
    });

    let offerData = {};
    if(offerResponse.status == 204){
        offerData.offerId = offer.offer_id;
        offerData.message = "offer everything's fine";
    }
    else
        offerData = await offerResponse.json();

    console.log(offerData)

    //publish offer

    const publishResponse = await fetch(`https://api.ebay.com/sell/inventory/v1/offer/${offerData.offerId}/publish/`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Language": "en-GB",
            "Authorization": "Bearer " + authToken
        }
    });
    const publishData = await publishResponse.json();

    console.log(publishData);

    //store ebay item in db
    if(!offer){
        await db.ebay_items.insert({
            id: matchingProduct.id,
            offer_id: offerData.offerId
        })
    }

    return {success: true, message: "item listed on ebay"};
}

module.exports = {
    checkEbayLink,
    createEbayLink,
    createEbayProduct
}