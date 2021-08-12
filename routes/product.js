const {createEbayProduct} = require('../queries/ebay');

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

            const result = await createEbayProduct(sellerID,productReference);

            console.log(result)

            return result;
        }
    },
];

module.exports = {
    productRoutes
}