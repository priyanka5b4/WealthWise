const dataLib = require('../dbLib/data.service');

module.exports.getRandomId = (len) => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < len; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports.getUniqueId = (dataModel, attributeName, cb) => {
  const id = this.getRandomId(6);
  const query = {};
  query[attributeName] = id;
  // eslint-disable-next-line consistent-return
  dataLib.getDataByQuery(query, dataModel, (err, res) => {
    if (err || res.length > 0) {
      return this.getUniqueId(dataModel, attributeName, cb);
    }
    cb(id);
  });
};
module.exports.clone = (obj) => JSON.parse(JSON.stringify(obj));
