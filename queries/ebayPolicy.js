const fetch = require("node-fetch");

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

module.exports = {
    createEbayPaymentPolicy
}