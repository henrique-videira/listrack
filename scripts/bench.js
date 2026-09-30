// Gas of AlienListrack's read-only tree construction vs slot size, and of proof
// verification on DrexListrack vs proof depth (Section 8.3 of the paper).
const { ethers, network } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
async function main(){
  const alien = await ethers.deployContract("AlienListrack",[20,0]);
  const addr = await alien.getAddress();
  const coder = ethers.AbiCoder.defaultAbiCoder(), hex32 = x=>ethers.toBeHex(x,32);
  await time.increase(20*100); // slots 0..99 closed
  let base=null;
  for (let p=0;p<12 && base===null;p++){
    const lenSlot = ethers.keccak256(coder.encode(["uint256","uint256"],[0,p]));
    await network.provider.send("hardhat_setStorageAt",[addr,lenSlot,hex32(1)]);
    if ((await alien.getSlotSize(0))==1n) base=p;
    await network.provider.send("hardhat_setStorageAt",[addr,lenSlot,hex32(0)]);
  }
  console.log("chainConfirmedTx storage slot:",base);
  for (const [si,n] of [16,64,256,1024,4096,8192].entries()){
    const key=si+1, lenSlot=ethers.keccak256(coder.encode(["uint256","uint256"],[key,base]));
    await network.provider.send("hardhat_setStorageAt",[addr,lenSlot,hex32(n)]);
    const d=BigInt(ethers.keccak256(lenSlot));
    for (let i=0;i<n;i++) await network.provider.send("hardhat_setStorageAt",[addr,hex32(d+BigInt(i)),ethers.keccak256(hex32(i+1))]);
    const est=async data=>{try{return (await ethers.provider.estimateGas({to:addr,data})).toString()}catch(e){return "exceeds block gas limit"}};
    console.log(`n=${n} root=${await est(alien.interface.encodeFunctionData("createMerkleTree",[key,false,0]))} proof=${await est(alien.interface.encodeFunctionData("createMerkleTree",[key,true,n-1]))}`);
  }
  const drex = await ethers.deployContract("DrexListrack",[20,2,6,12]); const daddr=await drex.getAddress();
  for (const L of [0,4,8,12,16,20]){
    const proof=[...Array(L)].map((_,i)=>ethers.keccak256(hex32(i+7)));
    const data=drex.interface.encodeFunctionData("validateMerkleProof",[ethers.keccak256("0x01"),0,2n**BigInt(L),proof,1]);
    console.log(`depth=${L} verify=${(await ethers.provider.estimateGas({to:daddr,data})).toString()}`);
  }
}
main().catch(e=>{console.error(e);process.exit(1)});
