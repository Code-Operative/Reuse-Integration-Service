const {test} = require('../queries/test');
const {getAuthToken} = require('../queries/tokens');
const fetch = require("node-fetch");
const {categories} = require('../data/categories');
const {testCategories} = require('../data/categories');
const {aspects} = require('../data/aspects');

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

            result.data = {};

            for(const category of categories){

                const categoryResponse = await fetch(`${process.env.REUSE_URL}/api/categories/${category.id}?output_format=JSON`,{
                    headers: {
                      "Authorization": "Basic " + process.env.REUSE_API_KEY,
                    }
                });
                const categoryData = await categoryResponse.json(); 

                result.data[categoryData.category.id] = {
                    name: categoryData.category.name,
                    parentCategoryID: categoryData.category.id_parent,
                    parentCategoryName: result.data[categoryData.category.id_parent]? result.data[categoryData.category.id_parent].name : "none",
                    matchingEbayID: 0,
                };
            }

            result.success = true;

            return result;
        }
    },
    {
        method: 'GET',
        path: '/test/categories/aspects',
        config: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            }
        },
        handler: async()=> {
            /*
            const fetch = require("node-fetch");
            let result = {};
            
            for(let categoryId in categories){
                const category = categories[categoryId];

                if(category.matchingEbayId != 0){
                    console.log("looking up " + category.name);
                    const aspectsResponse = await fetch(`https://api.ebay.com/commerce/taxonomy/v1/category_tree/3/get_item_aspects_for_category?category_id=${category.matchingEbayId}`,{
                        headers: {
                            'Authorization': 'Bearer v^1.1#i^1#I^3#f^0#p^3#r^0#t^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'
                        }
                    })
                    const {aspects} = await aspectsResponse.json();
                    let info = [];

                    if(aspects)
                    aspects.forEach(aspect => {
                        if(aspect.aspectConstraint.aspectRequired){
                            let aspectInfo = {
                                name: aspect.localizedAspectName,
                                type: aspect.aspectConstraint.aspectDataType,
                                mode: aspect.aspectConstraint.aspectMode,
                            }

                            if(aspect.aspectConstraint.aspectMode == "SELECTION_ONLY")
                                aspectInfo.options = aspect.aspectValues.map(value => value.localizedValue);

                            info.push(aspectInfo);
                        }
                    })
                    result[category.matchingEbayId] = {name: category.name, aspects: info};
                }
            }      */
            
            
            let result = {};
            
            for(let aspectKey in aspects){
                result[aspectKey] = aspects[aspectKey];
                let reuseCategoryId;

                Object.keys(categories).forEach(categoryId => {
                    if(categories[categoryId].matchingEbayId == aspectKey)
                        reuseCategoryId = categoryId;
                })

                result[aspectKey].reuseCategoryId = reuseCategoryId;
            }

            return result;
        }
    },
]

module.exports = {
    testRoutes
}