const fetch = require("node-fetch");

const createLocation = async (authToken, seller) => {
    //call the ebay location api with the address

    const merchantLocationKey = "reuse-location"

    await fetch(`https://api.ebay.com/sell/inventory/v1/location/${merchantLocationKey}`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Language": "en-GB",
            "Authorization": "Bearer " + authToken
        },
        body: JSON.stringify({
            location: {
                address: {
                    addressLine1: seller.address.split(",")[0],
                    city: seller.state,
                    postalCode: seller.address.split(",")[1],
                    country: "GB"
                }
            },
            locationInstructions: "Items ship from here.",
            name: merchantLocationKey,
            merchantLocationStatus: "ENABLED",
            locationTypes: [
                "WAREHOUSE"
            ]
        })
    })

    return merchantLocationKey;
}

const getLocations = async (authToken) => {
    const locationsResponse = await fetch(`https://api.ebay.com/sell/inventory/v1/location`,{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + authToken
        }
    })

    const result = await locationsResponse.json();
    
    return result;
}

module.exports = {
    createLocation,
    getLocations
}