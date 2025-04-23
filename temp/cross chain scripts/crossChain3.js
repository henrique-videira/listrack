// 1. Import ethers
const ethers = require('ethers');

const timeSlotDrex = 20; // in seconds
const drexLeg = 6; // in time slot
const alienConfirmation = 3*drexLeg; // in time slot
const alienExpiration = 2*alienConfirmation; // in time slot
//const equalbalance = (10**15); // 18 is the number of decimals

const equalbalance = 1000000000000000000000n;
//console.log (equalbalance)
// 2. Define network configurations
const providerRPC = {
  moonbeam: {
    name: 'moonbeam',
    rpc: 'https://rpc.api.moonbase.moonbeam.network', // Insert your RPC URL here
    chainId: 1287, 
  },
  sepolia: {
    name: 'sepolia',
    //rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    rpc: 'https://sepolia.infura.io/v3/bdbe3f664e2c4fe09240e7c3cffa1f56', // Insert your RPC URL here
    chainId: 11155111, 
  },
};
// 3. Create ethers provider

const alien = new ethers.JsonRpcProvider(providerRPC.moonbeam.rpc, {
  chainId: providerRPC.moonbeam.chainId,
  name: providerRPC.moonbeam.name,
});

  const drex = new ethers.JsonRpcProvider(providerRPC.sepolia.rpc, {
    chainId: providerRPC.sepolia.chainId,
    name: providerRPC.sepolia.name,
  });

const accounts =
    [ '64fcd5bfca4beb158d341ea8729f3572409cd82b3dc8ee938747a3b109bf037e',  // owner
      '95b4154d870c7f4d8be947b20c19eeec9ad5a6fc00fe9c2936fcf06c4149309f',  // alice
      '355138760889ceb11307c098bad2da2414f57e580aa92c92295a196d96f985ef',  // bob
      '3fc855b6cb5bb052c72bab7600dd5b4080c8f2fa0e331be242d2fb787719f018',  // charlie
      'ba15b4f8659e6dbcba29e6ad21483f742d397a90ee9c88ab98bf89f88a58bebd',  // debbie
      '21b07198907e720575b9590478110904c8788a3b508063cae003f0063e565827',  // eva
      '2214a90679770647740e88a649c92f50a428f6fd2264820ecff0a0bb18b8d3b1']; // mike

      const ownerAlien = new ethers.Wallet(accounts[0], alien);
      const aliceAlien = new ethers.Wallet(accounts[1], alien);
      const bobAlien = new ethers.Wallet(accounts[2], alien);
      const charlieAlien = new ethers.Wallet(accounts[3], alien);
      const debbieAlien = new ethers.Wallet(accounts[4], alien);
      const evaAlien = new ethers.Wallet(accounts[5], alien);
      const mikeAlien = new ethers.Wallet(accounts[6], alien);

      const alienSigners = [aliceAlien,mikeAlien];

      const owner = new ethers.Wallet(accounts[0], drex);
      const alice = new ethers.Wallet(accounts[1], drex);
      const bob = new ethers.Wallet(accounts[2], drex);
      const charlie = new ethers.Wallet(accounts[3], drex);
      const debbie = new ethers.Wallet(accounts[4], drex);
      const eva = new ethers.Wallet(accounts[5], drex);
      const mike = new ethers.Wallet(accounts[6], drex);

      const drexSigners = [alice,mike]

      const merkleSigners = [bob,charlie,debbie,eva];

      const alienMerkleSigners = [bobAlien,charlieAlien,debbieAlien,evaAlien];

      var fs = require('fs');

    async function CrossChainTransfer () { 

    //// DEPLOYING CONTRACTS 
    //// DEPLOYING CONTRACTS 
    //// DEPLOYING CONTRACTS 

    /// Drex Token 
    const parsedDrexToken = JSON.parse(fs.readFileSync("./artifacts/contracts/TokenDrex.sol/DrexToken.json"));
    const abiDrexToken = parsedDrexToken.abi;
    const codeDrexToken = parsedDrexToken.bytecode;

    const factory = new ethers.ContractFactory(abiDrexToken, codeDrexToken, owner);
    const drexToken = await factory.deploy();
    //const drexToken = new ethers.Contract('0x7e0bd14275d45da2a7EC3F81A769F394203Ad10C', abiDrexToken, drex);
    console.log ('Drex Token');
    console.log ('#######################');
    console.log (drexToken.target);  
    console.log (' ');
      
     /// Merkle Contract
     const parsedMerkle = JSON.parse(fs.readFileSync("./artifacts/contracts/DrexMerkle.sol/MerkleContract.json"));
     const abiMerkle = parsedMerkle.abi;
     const codeMerkle = parsedMerkle.bytecode;

     const factoryMerkle = new ethers.ContractFactory(abiMerkle, codeMerkle,owner); 
     const merkleContract = await factoryMerkle.deploy([bob.address,charlie.address,debbie.address,
     eva.address],[1,1,1,1],0);
     //const merkleContract = new ethers.Contract('0x87C86792F137A7CF0C79880437b8AE8efC6956c8', abiMerkle, drex);
    console.log ('Merkle Contract');
    console.log ('#######################');
    console.log (merkleContract.target); 
    console.log (' ');

    /// Listrack Contract
    const parsedListrack = JSON.parse(fs.readFileSync("./artifacts/contracts/DrexListrack.sol/DrexListrack.json"));
    const abiDrexListrack = parsedListrack.abi;
    const codeListrack = parsedListrack.bytecode;

     const factoryListrack = new ethers.ContractFactory(abiDrexListrack, codeListrack, owner); 
     const Listrack = await factoryListrack.deploy(timeSlotDrex,drexLeg,
    alienConfirmation,alienExpiration); 
    //const Listrack = new ethers.Contract('0xEfD87DD12319130cA81978F801e06d504FCC6778', abiDrexListrack, drex);

      console.log ('Listrack');
      console.log ('#######################');
      console.log (Listrack.target);
      console.log (' ');
    
     /// Alien Token
     const parsedAlienToken = JSON.parse(fs.readFileSync("./artifacts/contracts/TokenAlien.sol/AlienToken.json"));
     const abiAlienToken = parsedAlienToken.abi;
     const codeAlienToken = parsedAlienToken.bytecode;

    const factoryAlien = new ethers.ContractFactory(abiAlienToken, codeAlienToken, ownerAlien);
    const alienToken = await factoryAlien.deploy();
    //const alienToken = new ethers.Contract('0x4a5377f417341c4AF079c7458475490A315A5738', abi, alien);
    
    console.log ('AlienToken');
    console.log ('#######################');
    console.log (alienToken.target);   
    console.log (' ');

    /// Alien Listrack Contract
    const parsedAlienListrack = JSON.parse(fs.readFileSync("./artifacts/contracts/AlienListrack.sol/AlienListrack.json"));
    const abiAlienListrack = parsedAlienListrack.abi;
    const codeAlienListrack = parsedAlienListrack.bytecode;

    const factoryAlienListrack = new ethers.ContractFactory(abiAlienListrack, codeAlienListrack, ownerAlien); 
     const alienListrack = await factoryAlienListrack.deploy(
      alienConfirmation*timeSlotDrex, // this is the time slot in seconds
      alienExpiration*timeSlotDrex);  
   // const alienListrack = new ethers.Contract('0xAbFA5ad52d50924D2A756cedfBeC7F401BBDb2a6', abiAlienListrack, alien);

    console.log ('AlienListrack');
    console.log ('#######################');
    console.log (alienListrack.target); 
    console.log (' ');

    //// DEPLOYING CONTRACTS 
    //// DEPLOYING CONTRACTS 
    //// DEPLOYING CONTRACTS 
    //// DEPLOYING CONTRACTS 

    /// BEGINNING CROSS-CHAIN TRANSFER
    /// BEGINNING CROSS-CHAIN TRANSFER
    /// BEGINNING CROSS-CHAIN TRANSFER
    /// BEGINNING CROSS-CHAIN TRANSFER

    console.log ('Waiting 15 seconds to begin cross-chain transaction');
    console.log ('Execution delayed until Blocks are MINED');
    console.log ('');

    setTimeout (crossChainBegin, 15000);

    async function crossChainBegin () {

    console.log ('>> Resuming Cross-Chain Transaction of 50 Tokens in each Chain');
    console.log ('>> Resuming Cross-Chain Transaction of 50 Tokens in each Chain');
    console.log ('>> Resuming Cross-Chain Transaction of 50 Tokens in each Chain');
    console.log ('>> Resuming Cross-Chain Transaction of 50 Tokens in each Chain');

    // Transferring tokens from Drex Token Owner  
    const token_transfer = await drexToken.connect(owner).transfer(mike.address, equalbalance);
    await (token_transfer.wait());
    console.log ('Tokens transferred from Owner to Mike in Drex');

    // Transferring tokens from Alien Owner  
    const alien_token_transfer = await alienToken.connect(ownerAlien).transfer(aliceAlien.address, equalbalance);
    await (alien_token_transfer.wait());
    console.log ('Tokens transferred from Owner to Alice in AlienChain');
    console.log ('');


      console.log ('Alice Drex Balance :', await (drexToken.balanceOf(alice.address)));
      console.log ('Mike Drex Balance :', await (drexToken.balanceOf(mike.address)));

      const aliceDrexBalance = await (drexToken.balanceOf(alice.address));
      const mikeDrexBalance =  await (drexToken.balanceOf(mike.address));

      // Approving DrexListrack to spend Drex Tokens
        const tx_all = await (drexToken.connect(alice).
                    approve(Listrack.target, aliceDrexBalance));
        await (tx_all.wait());
        console.log ('Allowance from Alice to Listrack :' + await (drexToken.allowance(alice.address,Listrack.target)));
        
        const tx_all2 = await (drexToken.connect(mike).
                    approve(Listrack.target, mikeDrexBalance));
        await (tx_all2.wait());
        console.log ('Allowance from Mike to Listrack :' + await (drexToken.allowance(mike.address,Listrack.target)));
        console.log ('');
    //const tx3 = await alienToken.connect(ownerAlien).transfer(aliceAlien.address, equalbalance);
    //await tx3.wait();
    //const tx4 = await alienToken.connect(ownerAlien).transfer(mikeAlien.address, equalbalance);
    //await tx4.wait();

    console.log ('Alice Alien Token Balance', await (alienToken.balanceOf(aliceAlien.address)));
    console.log ('Mike Alien Balance', await (alienToken.balanceOf(mikeAlien.address)));

    
    const aliceAlienBalance = await (alienToken.balanceOf(aliceAlien.address));
    const mikeAlienBalance =  await (alienToken.balanceOf(mikeAlien.address));

      // Approving AlienListrack to spend Alien Tokens
        const tx_all3 = await (alienToken.connect(aliceAlien).
                    approve(alienListrack.target, aliceAlienBalance));
        await (tx_all3.wait());
        console.log ('Allowance from Alice to AlienListrack :' + await (alienToken.allowance(aliceAlien.address,alienListrack.target)));
        
        const tx_all4 = await (alienToken.connect(mikeAlien).
                    approve(alienListrack.target, mikeAlienBalance));
        await (tx_all4.wait());
        console.log ('Allowance from Mike to AlienListrack :' + await (alienToken.allowance(mikeAlien.address,alienListrack.target)));

        console.log ('');        
        console.log ("** Transactions TO BE Locked by Mike in Drex **");

        console.log ('>> Waiting Mike to lock Tx in Drex');
        console.log ('>> Waiting Mike to lock Tx in Drex');

        //console.log (await drexToken.balanceOf(Listrack.target));

            // Mike sends Tx in Drex
            for (let i = 0; i < drexSigners.length-1; i++) {
              const txMikeLock = await Listrack.connect(drexSigners[i+1]).setTrade(
              [drexSigners[i].address,
              drexSigners[i+1].address,
              drexToken.target],
              50000000000000000000n,
              [merkleContract.target],
              [alienSigners[i].address,
              alienSigners[i+1].address,
              alienToken.target],
              50000000000000000000n,
              '0x0000000000000000000000000000000000000000000000000000000000000000',
                );
              await (txMikeLock.wait());
              //console.log(txMikeLock);
            }

console.log ("** Transactions Locked by Mike in Drex **");
console.log ('');

setTimeout (crossMainInsertId, 10000);
console.log ("** Waiting for Tx confirmation in Drex **");
console.log ('');

    async function crossMainInsertId () {
      
  // array to store trades Id by user : user => Trades Id []
  tradesId = [];
  // each user can have several TxIds
  
  let i=0;
  while (i < drexSigners.length) {
    try {
    tradesId.push(await Listrack.
    connect(drexSigners[i]).getTxIdbyUser(drexSigners[i].address));
    i++;
    } catch (e) {
        console.log (e.message);
    }
    }
 // trades by user stored in tradesId


    // array to store trades to be sent to Alien Chain
  tradesToPushAlien = [];

  for (let i = 0; i < drexSigners.length; i++) {
    for (let j = 0; j < tradesId[i].length; j++) {
      // procedure to store tx details in tradesToPushAlien
      // to set tx in Alien Chain
    const temp = await Listrack.
    connect(drexSigners[i]).getDrexAlienInputsbyId(tradesId[i][j]);
    //console.log ('Get Drex inputs' + temp);
    const _drexHashFields = temp[0][3];
    const _alienAliceAddress = temp[0][4];
    const _alienMikeAddress = temp[0][5];
    const _alienTokencontract = temp[0][6];
    const _alienAmount = temp[0][8];
    const _hashedSecret = temp[0][9];
    const _drexPreviousId = temp[0][11][4];
    const _drexTxIndex = temp[0][11][3];
    const _drexTxId = tradesId[i][j];
    const _drexAlienConfirmationIndex = temp[1];
   
    tradesToPushAlien.push([_drexHashFields,_alienAliceAddress,
      _alienMikeAddress,_alienTokencontract,_alienAmount,
      _hashedSecret,_drexPreviousId,_drexTxIndex,_drexTxId,_drexAlienConfirmationIndex]);};
    }

  //  console.log ('Trades to push Alien | ' + tradesToPushAlien);
 // the below array store the txs that were settled in Alien Chain
 txIdsAlienPushed = [];

 console.log ('>> Waiting writing Alien Leg Tx');
 console.log ('>> Waiting writing Alien Leg Tx');
  
  for (let i=tradesToPushAlien.length-1; i<tradesToPushAlien.length; i++) {
    for (let j=0; j<drexSigners.length ; j++) {
        // confirms if txId is pushed by Alice
      //  console.log (alienSigners[j].address);
    if (alienSigners[j].address == tradesToPushAlien[i][1]) {
        // confirms if txId is not already pushed
    if (txIdsAlienPushed.indexOf(tradesToPushAlien[i][8])==-1) {
    const txAliceSettles = await alienListrack.connect(alienSigners[j]).
    writeAlienLeg(tradesToPushAlien[i][0],
    tradesToPushAlien[i][1], // alice Alien Address
    tradesToPushAlien[i][2],tradesToPushAlien[i][3],
    tradesToPushAlien[i][4],tradesToPushAlien[i][5],
    tradesToPushAlien[i][6],tradesToPushAlien[i][7],
    tradesToPushAlien[i][8]);
    await (txAliceSettles.wait());
    txIdsAlienPushed.push(tradesToPushAlien[i][8]);
    }
    }
    }
  }

console.log ("** Trades Settled in Alien Chain **");
console.log ('');

//console.log ('Tx Ids Pushed',txIdsAlienPushed);

// the array below is to store the alien features of the Tx Id settled in Alien Chain
TxValidation = [];

const alfred      = drexSigners [0];
const alfredAlien = alienSigners[0];

// array with slots to be searched
  slotNumber = [];

  for (let i=txIdsAlienPushed.length-1; i<txIdsAlienPushed.length; i++) {
    //console.log (txIdsAlienPushed[i]);
    //console.log (await alienListrack.connect(alfredAlien).getTradeFeatures(txIdsAlienPushed[i]));
    const alienFeatures = await alienListrack.connect(alfredAlien)
                          .getTradeFeatures(txIdsAlienPushed[i]);
    //console.log (typeof alienFeatures);
    const merkleProof = await alienListrack.connect(alfredAlien).
                          createMerkleTree(alienFeatures[0],true,alienFeatures[1]);
    //console.log (merkleProof);
    TxValidation[i] = [txIdsAlienPushed[i],alienFeatures[1],merkleProof,alienFeatures[0]];

    // storing the slot numbers for validation in Merkle Contract
    if (slotNumber.indexOf(alienFeatures[0])==-1) slotNumber.push(alienFeatures[0]);
   // console.log (TxValidation[i]);
  }

  //console.log ("** Merkle Proof generated by Alien Listrack to each TxId **");
  /// MERKLE CONTRACT LISTENING TO ALIEN CHAIN
  /// MERKLE CONTRACT LISTENING TO ALIEN CHAIN
  /// MERKLE CONTRACT LISTENING TO ALIEN CHAIN

  console.log ("** Each Merkle Signer listens to Alien Merkle Root through gasfree Tx **");

  //console.log ('Transaction Slot Number :',slotNumber);

  console.log ('>> Waiting Merkle Signers sign Merkle Root Tx in Merkle Contract');
  console.log ('>> Waiting Merkle Signers sign Merkle Root Tx in Merkle Contract');

  for (j = 0; j<slotNumber.length; j++) { // validation for each block in the transactions
  for (let i=0; i<merkleSigners.length-1;i++){
  // not all Merkle Signers are required to listen
  // to Transactions because only 70% are required for approval
  // if the last Merkle Signer sends a Merkle Root approval for
  // an approval already done Tx is reverted
  // const latestSlot = await (alienListrack.connect(merkleSigners[i]).getLatestSlot());

  const slotToVerify = slotNumber[j];
  //console.log (slotToVerify);
  const merkleRoot = await (alienListrack.connect(alienMerkleSigners[i]).createMerkleTree(slotToVerify,false,0));
  //console.log(merkleRoot);
  // merkleRoot[0] is the Merkle Root returned by Function in a array object
  const txMerkle = await (merkleContract.connect(merkleSigners[i]).insertMerkleForApproval(merkleRoot[0],slotToVerify));
  await txMerkle.wait();
    }
  }

  console.log ("** Each Merkle Signer completed Alien Merkle Root insertion in Drex Merkle **");
  console.log ('');


  console.log ("** Tx can now be manually settled in Drex **");

  console.log ('>> Waiting Alice to provide Tx Proof in order to settle Tx in Drex Listrack');
  console.log ('>> Waiting Alice to provide Tx Proof in order to settle Tx in Drex Listrack');
  /// MERKLE CONTRACT REACHED CONSENSUS ON ALIEN CHAIN
  
   /// SENDING TRANSACTIONS FOR SETTLEMENT IN DREX LISTRACK BY ALICE

   for (let i=0; i<TxValidation.length; i++) {
    //console.log ('Campos da Validacao',TxValidation[i]);
    merkleProof = Object.values(TxValidation[i][2]);
    //console.log ('Tx Id',TxValidation[i][0]);
    //console.log ('Slot Number',TxValidation[i][3]);
    //console.log ('Slot Index',TxValidation[i][1]);
    //console.log ('Merkle Proof', merkleProof);
   const txDrexSettlement = await Listrack.connect(alice)
                  .aliceSettleTrade(TxValidation[i][0],TxValidation[i][1],
                   merkleProof,TxValidation[i][3],
                    '0x0000000000000000000000000000000000000000000000000000000000000000');
    await (txDrexSettlement).wait();
  }

  console.log ("** Cross-chain transfer completed **");
  console.log ('');

  console.log ("** Balances after Cross-chain transfer **");
  console.log ('Alice Drex Balance :', await (drexToken.balanceOf(alice.address)));
  console.log ('Mike Drex Balance :', await (drexToken.balanceOf(mike.address)));
  console.log ('');
  console.log ('Alice AlienToken Balance', await (alienToken.balanceOf(aliceAlien.address)));
  console.log ('Mike AlienToken Balance', await (alienToken.balanceOf(mikeAlien.address)));

     }

    }

}
       

     CrossChainTransfer();

      
          
// signers and await tx.wait();



// https://docs.moonbeam.network/builders/ethereum/libraries/ethersjs




/*
 Deploying Every Contract in every chain
#######################
0x4Ca7BE74411B89e4737ef1594Ac47F33C9Ed7175     DrexToken
#######################
0x1352C77b6676b62b49D3eA78c8C887070eD44D63     AlienToken
#######################
0x5D24C726ce6062AfbC32AceeaF66D525f44354dB     Merkle
#######################
0x03898DAd231A2B9D9eCA58124Ab9e247AFb02bC8     Listrack
#######################
0x4F72A973dc2c10F664B5738b0Ca7Fd3f14f4bcEE     AlienListrack

*/