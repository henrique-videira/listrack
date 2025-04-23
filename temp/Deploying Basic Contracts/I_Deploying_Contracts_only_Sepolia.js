// npx hardhat test test\00RegularTx.js

const {expect} = require("chai");
const { ethers } = require("hardhat");
const { provider } = ethers.getDefaultProvider();

const timeSlotDrex = 20; // in seconds
const drexLeg = 6; // in time slot
const alienConfirmation = 3*drexLeg; // in time slot
const alienExpiration = 2*alienConfirmation; // in time slot

//import {hre} from "hardhat/types"
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const {time} = require("@nomicfoundation/hardhat-network-helpers");

describe("Deploying Every Contract in every chain", function() {

  it ('Should Deploy Contracts Properly', async function () {

  await hre.switchNetwork('mainnet');

  const [owner,alice,bob,charlie,debbie,eva,mike] = await ethers.getSigners();
    
  const drexSigners = [alice,mike];
  const alienSigners = [alice,mike];
   // frank,george,harry,irene,jack,kelly,larry,mike,nancy,
  
  const merkleSigners = [bob,charlie,debbie,eva];
  
  const equalbalance = 1000000000000000000000n;
  
  const drexTokenFactory = await ethers.getContractFactory("DrexToken");
  const drexToken = await drexTokenFactory.connect(owner).deploy();
  //const drexToken = drexTokenFactory.attach('0x9840EeC2eb6DA5F07088DA094dD5DCF4CC73094f'); // everyone has Drex Token in Sepolia
  console.log ('Drex Token');
  console.log ('#######################');
  console.log (drexToken.target);
  //console.log (await (drexToken.balanceOf(owner.address)));
  
  // the below code is the first token transfer to users

  
  for (let i = 0; i < drexSigners.length; i++) {
    await drexToken.connect(owner).transfer(drexSigners[i].address, equalbalance);
    }
  
    /*
  for (let i = 0; i < drexSigners.length; i++) {
    const token_transfer = await drexToken.connect(owner).transfer(drexSigners[i].address, equalbalance);
    await (token_transfer.wait());
    }
    */

    //0xD8a8ac05B5016BCb646f93179eEb2cBc377Db528

const merkleFactory = await ethers.getContractFactory("MerkleContract");
  const merkleContract 
  = await merkleFactory.deploy([bob.address,charlie.address,debbie.address,
    eva.address],[1,1,1,1],0);
//const merkleContract = merkleFactory.attach('0x4aBa1396ead9E7d15f95E62fF6f3D1C5301cd283');
console.log ('Merkle Contract');
console.log ('#######################');
console.log (merkleContract.target);
// 0xf4F468aA3CFbd7c3484EAAE560C39c5Dc56c904a

 /* Setup for Listrack Contract */  
const factoryListrack = await ethers.getContractFactory("DrexListrack");
const Listrack = await factoryListrack.deploy(timeSlotDrex,drexLeg,
                                    alienConfirmation,alienExpiration);
                                  
//const Listrack = factoryListrack.attach('0xEfe67A371D784b32EB5eD6A93e187Ab233664908');
console.log ('Listrack');
console.log ('#######################');
console.log (Listrack.target);
// 0x6bbEb616b09E44acE860F386ad6f06A17D203272

    console.log ("** End **");
    console.log ("** End  **");
});

/*
const _tx = await (alienToken.connect(alienSigners[i]).
                approve(alienListrack.target, equalbalance));
    const _txReceipt = await _tx.wait();
console.log(_txReceipt.logs[0].args[2]);
*/
   
});