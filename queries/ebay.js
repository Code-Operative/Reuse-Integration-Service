const {_db} = require('./query');

const checkEbayLink = async (email) => {
    const db = await _db;

    const seller = await db.sellers.findOne({email});

    let result;

    if(seller){
        const ebayAccount = await db.ebay_accounts.findOne({
            seller_id: seller.id
        });
        if(ebayAccount){
            const verifiedWithEbay = false; //change this to an actual call to ebay when I can;
            result = {success: true, data: ebayAccount, verifiedWithEbay}; 
        }
        else
            result = {success: false, message: "no ebay account linked to that seller"};
    }
    else
        result = {success: false, message: "no seller with that email registered"};

    return result;
}

const createEbayLink = async (sellerId) => {
    const db = await _db;

    
}

module.exports = {
    checkEbayLink,
    createEbayLink
}