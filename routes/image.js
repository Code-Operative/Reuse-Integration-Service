const fetch = require("node-fetch");

const imageRoutes = [
    {
        method: 'GET',
        path: '/image/{productID}/{imageID}',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async(request, h)=> {
            const {productID,imageID} = request.params;

            const imageResponse = await fetch(`${process.env.REUSE_URL}/api/images/products/${productID}/${imageID}`,{
                headers: {
                  "Authorization": "Basic " + process.env.REUSE_API_KEY,
                }
            });
            const imageData = await imageResponse.blob();     
            
            const response = h.response(imageData.stream());

            response.header('Content-type','image/jpeg');            

            return response;
        }
    }
];

module.exports = {
    imageRoutes
}