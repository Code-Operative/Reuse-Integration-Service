const {_db} = require('./query');
const {getAuthToken} = require('./tokens');

const {categories} = require('../data/categories');

const checkForOrders = async () => {
    const db = await _db;
    const fetch = require("node-fetch");

    const items = await db.items.find({"quantity >": 0});

    let result;

    let itemData = [];

    //iterate through the items array
    for(const item of items) {
        const productResponse = await fetch(`${process.env.REUSE_URL}/api/products/${item.id}?output_format=JSON`,{
            headers: {
              "Authorization": "Basic " + process.env.REUSE_API_KEY,
            }
        });

        let quantityOnReuse;
        let stockID;

        if(productResponse.status == 200){
            const productData = await productResponse.json();

            stockID = productData.product.associations.stock_availables[0].id;

            const stockResponse = await fetch(`${process.env.REUSE_URL}/api/stock_availables/${stockID}?output_format=JSON`,{
                headers: {
                "Authorization": "Basic " + process.env.REUSE_API_KEY,
                }
            });
            const stockData = await stockResponse.json()

            quantityOnReuse = parseInt(stockData.stock_available.quantity);
        }

        //quantityOnReuse is null when we don't get a response from reuse or a product was deleted
        if(quantityOnReuse){
        
        const authToken = await getAuthToken(item.seller_id);

        const ebayItem = await db.ebay_items.findOne({id: item.id});

        const ebayOfferResponse = await fetch(`https://api.ebay.com/sell/inventory/v1/offer/${ebayItem.offer_id}`,{
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + authToken
            }
        });
        const ebayOfferData = await ebayOfferResponse.json();

        const quantityOnEbay = ebayOfferData.availableQuantity;

        let lowestQuantity;

        if(quantityOnEbay < quantityOnReuse){
            lowestQuantity = quantityOnEbay;

            const stockUpdateBody = `<?xml version="1.0" encoding="UTF-8"?><prestashop xmlns:xlink="http://www.w3.org/1999/xlink"><stock_available><id>${stockID}</id><id_product>${item.id}</id_product><id_product_attribute>0</id_product_attribute><id_shop>1</id_shop><id_shop_group>0</id_shop_group><quantity>${lowestQuantity}</quantity><depends_on_stock>0</depends_on_stock><out_of_stock>2</out_of_stock><location>""</location></stock_available></prestashop>`;

            await fetch(`${process.env.REUSE_URL}/api/stock_availables/${stockID}?output_format=JSON`,{
                method: "PUT",
                headers: {
                    "Authorization": "Basic " + process.env.REUSE_API_KEY,
                    "Content-Type": "application/xml"
                },
                body: stockUpdateBody
            });

            await db.items.update({id: item.id},{
                quantity: lowestQuantity
            });
        }
        if(quantityOnReuse < quantityOnEbay){
            lowestQuantity = quantityOnReuse;

            const updatedEbayOffer = Object.assign({},ebayOfferData);
            updatedEbayOffer.availableQuantity = lowestQuantity;

            await fetch(`https://api.ebay.com/sell/inventory/v1/offer/${ebayItem.offer_id}`,{
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Language": "en-GB",
                    "Authorization": "Bearer " + authToken
                },
                body: JSON.stringify(updatedEbayOffer)
            })

            await db.items.update({id: item.id},{
                quantity: lowestQuantity
            });
        }

        itemData.push({
            id: item.id,
            quantityOnReuse,
            quantityOnEbay,
            quantityInDb: item.quantity
        });
        }
    };

    result = {success: true, data: itemData};

    return result;
}

const checkCategoryIsValid = (potentialCategoryId) => {
    let ebayCategoryId;

    if(categories[potentialCategoryId])
        ebayCategoryId = categories[potentialCategoryId].matchingEbayId;
    else
        return {success: false, message: "There is no entry in the list of reuse categories for this category."};

    if(!ebayCategoryId || ebayCategoryId == 0)
        return {success: false, message: 
            `Ebay Integration: The default category chosen for this product isn't valid for ebay.
            \nEbay requires that categorise be as specific as possible, so you need to choose a default category at the bottom of the file system.
            \nIn addition, the following categories aren't available for use with ebay at this time:
            Small Electricals >> Kitchen
            Small Electricals >> Cleaning
            Home & Garden >> Garden Tools & Accessories
            Home & Garden >> Kitchen Accessories
            Home & Garden >> Bric a Brac
            Home & Garden >> Home Decor
            \nIf you'd like to use them, please email info@reuse-home.org.uk with your request.
            `
        };
    else
        return {success: true, message: "category is valid", ebayCategoryId}
}

module.exports = {
    checkForOrders,
    checkCategoryIsValid
}

