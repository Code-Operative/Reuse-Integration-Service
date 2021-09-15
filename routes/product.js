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

            let result;

            //introduce a delay to let prestashop set up the actual product

            try{
                setTimeout(async ()=>{
                    result = await createEbayProduct(sellerID,productReference);
                },5000);
            }
            catch(error){
                result = error;
            }

            console.log(result)

            return result;
        }
    },
];

module.exports = {
    productRoutes
}
