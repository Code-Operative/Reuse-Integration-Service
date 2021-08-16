const {_db} = require('./query');
const {getAuthToken} = require('./tokens');

const checkForOrders = async () => {
    const db = await _db;
    const fetch = require("node-fetch");

    const items = await db.items.find({"quantity >": 0});

    let result;

    let itemData = [];

    //iterate through the items array
    for(const item of items) {
        const productResponse = await fetch(`https://reusenetwork.code-operative.co.uk/api/products/${item.id}?output_format=JSON`,{
            headers: {
              "Authorization": "Basic " + process.env.REUSE_API_KEY,
            }
        });

        let quantityOnReuse;
        let stockID;

        if(productResponse.status == 200){
            const productData = await productResponse.json();

            stockID = productData.product.associations.stock_availables[0].id;

            const stockResponse = await fetch(`https://reusenetwork.code-operative.co.uk/api/stock_availables/${stockID}?output_format=JSON`,{
                headers: {
                "Authorization": "Basic " + process.env.REUSE_API_KEY,
                }
            });
            const stockData = await stockResponse.json()

            quantityOnReuse = parseInt(stockData.stock_available.quantity);
        }
        else{
            quantityOnReuse = 0;
        }

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

            console.log(`This is happening for ${item.id}`);

            const stockUpdateBody = `<?xml version="1.0" encoding="UTF-8"?><prestashop xmlns:xlink="http://www.w3.org/1999/xlink"><stock_available><id>${stockID}</id><id_product>${item.id}</id_product><id_product_attribute>0</id_product_attribute><id_shop>1</id_shop><id_shop_group>0</id_shop_group><quantity>${lowestQuantity}</quantity><depends_on_stock>0</depends_on_stock><out_of_stock>2</out_of_stock><location>""</location></stock_available></prestashop>`;

            await fetch(`https://reusenetwork.code-operative.co.uk/api/stock_availables/${stockID}?output_format=JSON`,{
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
    };

    result = {success: true, data: itemData};

    return result;
}

module.exports = {
    checkForOrders
}