const {aspects} = require('../data/aspects');
const {categories} = require('../data/categories');

const getAspects = (ebayCategoryId) => {
    const itemAspects = {};

    const aspectRequirements = aspects[ebayCategoryId];
    const aspectList = aspectRequirements.aspects;

    aspectList.forEach(aspect => {
        if(aspect.mode == "FREE_TEXT")
            itemAspects[aspect.name] = ["none"];
        if(aspect.mode == "SELECTION_ONLY"){
            const parentCategoryName = categories[aspectRequirements.reuseCategoryId].parentCategoryName;
            let selectedValue;

            aspect.options.forEach(option => {
                if(option.slice(0,1) == parentCategoryName.slice(0,1))
                    selectedValue = option;
            })

            if(selectedValue)
                itemAspects[aspect.name] = [selectedValue];
            else
                itemAspects[aspect.name] = [aspect.options[0]];
            
        }
    })

    return itemAspects;
}

module.exports = {
    getAspects
}