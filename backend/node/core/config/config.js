const development = {
  connString:
    process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost/wealthWise',
  jwtSecretKey: 'Test',
};
const production = {
  connString: process.env.MONGODB_CONNECTION_STRING,
  jwtSecretKey: 'Test',
};
module.exports = {
  development,
  production,
  get_config_profile() {
    return process.env.PROFILE || 'development';
  },
  get_config: () => {
    const configProfile = process.env.PROFILE || 'development';
    console.log(`CONFIG PROFILE SELECTED IS:  ${configProfile}`);
    console.log(development);
    if (configProfile === 'development') {
      return development;
    }
    return production;
  },
};
