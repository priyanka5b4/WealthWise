const mongoose = require('mongoose');
const config = require('../config/config');

const envConfig = config.get_config();

module.exports.connect = (autoReconnect) => {
  console.log('Trying to connect to MongoDB');

  const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  console.log(`DB AUTO RECONNECT: ${dbOptions.auto_reconnect}`);
  console.log(envConfig);
  const connect = () => {
    mongoose.connect(envConfig.connString, dbOptions).catch((rejected) => {
      console.log('Failed Connecting to DB' + rejected);
      console.log('Trying to reconnect');
      connect();
    });
  };

  connect();

  const db = mongoose.connection;

  db.on('connecting', () => {
    console.log('connecting to MongoDB...');
  });

  db.on('error', (error) => {
    console.error(`Error in MongoDb connection: ${error}`);
    mongoose.disconnect();
  });
  db.on('connected', () => {
    console.log('MongoDB connected!');
  });
  db.once('open', () => {
    console.log('MongoDB connection opened!');
  });
  db.on('reconnected', () => {
    console.log('MongoDB reconnected!');
  });
  db.on('disconnected', () => {
    if (dbOptions.auto_reconnect) {
      console.log('MongoDB disconnected!');
      mongoose.connect(config.connection_string, dbOptions);
    }
  });
};

module.exports.disconnect = () => {
  mongoose.disconnect();
};
