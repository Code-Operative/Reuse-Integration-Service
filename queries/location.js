const fetch = require("node-fetch");

const createLocation = async (authToken, seller) => {
    const addressesResponse = await fetch(`${process.env.REUSE_URL}/api/addresses?output_format=JSON`,{
        headers: {
            "Authorization": "Basic " + process.env.REUSE_API_KEY,
        }
    });
    const addressesData = await addressesResponse.json();

    //loop through addresses, find the address with the matching customer id
    let matchingAddress;
    for(const address of addressesData.addresses){
        const addressResponse = await fetch(`${process.env.REUSE_URL}/api/addresses/${address.id}?output_format=JSON`,{
            headers: {
                "Authorization": "Basic " + process.env.REUSE_API_KEY,
            }
        });
        const addressData = await addressResponse.json();

        if(addressData.address.id_customer == seller.id_customer){
            matchingAddress = addressData.address;
            break;
        }
    }

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
                    addressLine1: matchingAddress.address1,
                    city: matchingAddress.city,
                    postalCode: matchingAddress.postcode,
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

module.exports = {
    createLocation
}