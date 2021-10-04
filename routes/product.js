const {createEbayProduct} = require('../queries/ebay');
const {checkCategoryIsValid} = require('../queries/check');

const productRoutes = [
    {
        method: 'POST',
        path: '/product/ebay',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async(request)=> {
            const {sellerID, productReference} = request.payload;

            //introduce a delay to let prestashop set up the actual product
            const delay = require('util').promisify(setTimeout);
            await delay(5000);

            let result;
            try{
                result = await createEbayProduct(sellerID,productReference);
            }
            catch(error){
                result = error;
            }

            console.log(result)

            return result;
        }
    },
    {
        method: 'GET',
        path: '/product/ebay/category/{categoryId}',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async(request)=> {
            const {categoryId} = request.params;

            let result;

            result = await checkCategoryIsValid(categoryId);

            console.log(result)

            return result;
        }
    },
];

module.exports = {
    productRoutes
}
