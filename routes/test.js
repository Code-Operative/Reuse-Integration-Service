const {test} = require('../queries/test');
const {getAuthToken} = require('../queries/tokens');
const fetch = require("node-fetch");
const {categories} = require('../data/categories');

const testRoutes = [
    {
        method: 'GET',
        path: '/test/categorieslength',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async(request)=> {
            const result =categories.length;

            return result;
        }
    },
    {
        method: 'GET',
        path: '/test/categories',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async(request)=> {
            const categoriesResponse = await fetch(`${process.env.REUSE_URL}/api/categories?output_format=JSON`,{
                headers: {
                  "Authorization": "Basic " + process.env.REUSE_API_KEY,
                }
            });
            const {categories} = await categoriesResponse.json();     

            let result = {};

            result.data = [];

            for(const category of categories){

                const categoryResponse = await fetch(`${process.env.REUSE_URL}/api/categories/${category.id}?output_format=JSON`,{
                    headers: {
                      "Authorization": "Basic " + process.env.REUSE_API_KEY,
                    }
                });
                const categoryData = await categoryResponse.json(); 

                result.data.push({
                    id: categoryData.category.id,
                    name: categoryData.category.name,
                });
            }

            result.success = true;

            return result;
        }
    },
]

module.exports = {
    testRoutes
}