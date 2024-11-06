const datamodel = require('../../core/dbLib/data.service');
const Item = require('./Item.model');

module.exports.createItem = async (newItem) => {
  try {
    if (!newItem) {
      throw new Error('Empty Item Sent for Creation');
    }
    const tItem = new Item(newItem);
    await tItem.save();
  } catch (err) {
    console.log(err);
    throw new Error(
      `Error inserting item details for item ID: ${newItem.item_id} in mongo db: ${err}`,
    );
  }
};

module.exports.updateCursor = async (item_id, cursor) => {
  try {
    await Item.updateOne({ item_id: item_id }, { cursor: cursor });
  } catch (err) {
    console.log(err);
  }
};

module.exports.getCursorDetails = async (access_token) => {
  try {
    const cursor = await Item.find(
      { access_token: access_token },
      { cursor: 1, _id: 0 },
    ).exec();
    console.log(cursor);
    return cursor[0].cursor;
  } catch (err) {
    console.log(err);
  }
};

module.exports.getAllItems = () => {
  datamodel.getAllData(Item);
};
