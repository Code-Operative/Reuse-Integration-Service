const {_db} = require('./query');

const test = async () => {
    const db = await _db;

    const result = await db.test.findOne({},{});

    return result;
}

module.exports = {
    test
}