require ("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require ("hardhat-switch-network");
//require("hardhat-change-network");
//const {API_URL} = process.env;
/** @type import('hardhat/config').HardhatUserConfig */

  module.exports = {
  //solidity: "0.8.28",
  solidity: "0.8.24",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      gas: "auto",
    },
  mainnet: { 
    url: '',
    accounts: 
    [ '',  // owner
      '',  // alice
      '',  // bob
      '',  // charlie
      '',  // debbie
      '',  // eva
      '']  // mike
  },
  alien:  {  // moonbeam
    url: 'https://rpc.api.moonbase.moonbeam.network',
    chainId: 1287,
    accounts: 
    [ '',  // owner
      '',  // alice
      '',  // bob
      '',  // charlie
      '',  // debbie
      '',  // eva
      '']  // mike
  },
  sepolia: {
      url: 'https://sepolia.infura.io/v3/APIKEY',
      chainId: 11155111,
      accounts: 
      [ '',  // owner
        '',  // alice
        '',  // bob
        '',  // charlie
        '',  // debbie
        '',  // eva
        '']  // mike
    },
  moonbeam: {  // moonbeam
    url: 'https://rpc.api.moonbase.moonbeam.network',
    chainId: 1287,
    accounts: 
    [ '',  // owner
      '',  // alice
      '',  // bob
      '',  // charlie
      '',  // debbie
      '',  // eva
      '']  // mike
  }
  }
};