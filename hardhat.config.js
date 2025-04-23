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
    }
  }
};