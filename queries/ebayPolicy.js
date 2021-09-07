const fetch = require("node-fetch");

const getPaymentPolicies = async (authToken) => {
    const paymentPoliciesResponse = await fetch(`https://api.ebay.com/sell/account/v1/payment_policy?marketplace_id=EBAY_GB`,{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + authToken
        }
    })
    const result = await paymentPoliciesResponse.json();

    return result;
}

const createEbayPaymentPolicy = async (authToken) => {
    const newPaymentPolicyResponse = await fetch(`https://api.ebay.com/sell/account/v1/payment_policy`,{
        method: "POST",
        headers: {
             "Content-Type": "application/json",
            "Content-Language": "en-GB",
            "Authorization": "Bearer " + authToken
        },
        body: JSON.stringify({
            categoryTypes: [
                {
                    name: "ALL_EXCLUDING_MOTORS_VEHICLES",
                    default: true
                }
            ],
            name: "reuse-payment",
            description: "Standard payment policy, PP & CC payments",
            marketplaceId: "EBAY_GB",
            immediatePay: false,
            paymentMethods: [
                {
                    paymentMethodType: "CREDIT_CARD",
                    brands: [
                        "MASTERCARD",
                        "VISA"
                    ]
                }
            ]
        })
    });

    const newPaymentPolicyData =  await newPaymentPolicyResponse.json();

    console.log(newPaymentPolicyData);

    return newPaymentPolicyData.paymentPolicyId;
}

const getReturnPolicies = async (authToken) => {
    const returnPoliciesResponse = await fetch(`https://api.ebay.com/sell/account/v1/return_policy?marketplace_id=EBAY_GB`,{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + authToken
        }
    })
    const result = await returnPoliciesResponse.json();

    return result;
}

const createEbayReturnPolicy = async (authToken) => {
    const newReturnPolicyResponse = await fetch(`https://api.ebay.com/sell/account/v1/return_policy`,{
        method: "POST",
        headers: {
             "Content-Type": "application/json",
            "Content-Language": "en-GB",
            "Authorization": "Bearer " + authToken
        },
        body: JSON.stringify({
            name: "reuse-return",
            marketplaceId: "EBAY_GB",
            categoryTypes: [
                {
                    name: "ALL_EXCLUDING_MOTORS_VEHICLES",
                    default: true
                }
            ],
            returnsAccepted: true,
            returnPeriod: {
                value: 30,
                unit: "DAY"
            },
            refundMethod: "MONEY_BACK",
            returnShippingCostPayer: "SELLER"
        })
    });

    const newReturnPolicyData =  await newReturnPolicyResponse.json();

    console.log(newReturnPolicyData);

    return newReturnPolicyData.returnPolicyId;
}

const getFulfillmentPolicies = async (authToken) => {
    const fulfillmentPoliciesResponse = await fetch(`https://api.ebay.com/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_GB`,{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + authToken
        }
    })
    const result = await fulfillmentPoliciesResponse.json();

    return result;
}

const createEbayFulfillmentPolicy = async (authToken) => {
    const newFulfillmentPolicyResponse = await fetch(`https://api.ebay.com/sell/account/v1/fulfillment_policy`,{
        method: "POST",
        headers: {
             "Content-Type": "application/json",
            "Content-Language": "en-GB",
            "Authorization": "Bearer " + authToken
        },
        body: JSON.stringify({
            name: "reuse-shipping",
            marketplaceId: "EBAY_GB",
            categoryTypes: [
                {
                    name: "ALL_EXCLUDING_MOTORS_VEHICLES",
                    default: true
                }
            ],
            handlingTime: {
                value: 1,
                unit: "DAY"
            },
            shippingOptions: [
                {
                    optionType: "DOMESTIC",
                    costType: "FLAT_RATE",
                    shippingServices: [
                        {
                            sortOrder: 1,
                            shippingCarrierCode: "Parcelforce",
                            shippingServiceCode: "UK_Parcelforce24",
                            shippingCost: {
                                value: "0.0",
                                currency: "GBP"
                            },
                            additionalShippingCost: {
                                value: "0.0",
                                currency: "GBP"
                            },
                            freeShipping: true,
                            buyerResponsibleForShipping: false,
                            buyerResponsibleForPickup: false
                        }
                    ],
                    insuranceOffered: false,
                    insuranceFee: {
                        value: "0.0",
                        currency: "GBP"
                    }
                }
            ],
            globalShipping: false,
            pickupDropOff: false,
            freightShipping: false
        })
    });

    const newFulfillmentPolicyData =  await newFulfillmentPolicyResponse.json();

    console.log(newFulfillmentPolicyData);

    return newFulfillmentPolicyData.fulfillmentPolicyId;
}

module.exports = {
    createEbayPaymentPolicy,
    createEbayReturnPolicy,
    createEbayFulfillmentPolicy,
    getPaymentPolicies,
    getReturnPolicies,
    getFulfillmentPolicies
}