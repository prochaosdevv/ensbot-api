const { Contract } = require("ethers");
const { ethers } = require('ethers');
const {RegistrarABI} = require("../utils/RegistrarABI");
const ens = require("../models/ensModel");
const { BaseRegistrarABI } = require("../utils/BaseRegistrarABI");
const keccakHelper = require("keccak");
const namehash = require('eth-ens-namehash'); 
const {NameWrapperABI} = require("../utils/NameWrapperABI");
const transferTxn = require("../models/transferTxnModel");


const provider = new ethers.JsonRpcProvider(process.env.DEFAULT_RPC);
// Contract address and ABI
const registrarAddress = process.env.REGISTRAR_CONTRACT; // Replace with the contract address
const registrarAbi = RegistrarABI
const registrarContract = new ethers.Contract(registrarAddress, registrarAbi, provider);


const nameWrapperAddress = process.env.NAME_WRAPPER_CONTRACT; // Replace with the contract address
const nameWrapperAbi = NameWrapperABI
const nameWrapperContract = new ethers.Contract(nameWrapperAddress, nameWrapperAbi, provider);
 
const baseRegistrarAddress = process.env.BASE_RESISTRAR_CONTRACT; // Replace with the contract address
const baseRegistrarAbi = BaseRegistrarABI
const baseRegistrarContract = new ethers.Contract(baseRegistrarAddress, baseRegistrarAbi, provider);
 
  
const resolver = "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD";
const duration = 60 * 60 * 24 * 365; // 1 year
 
const secret = "0x0000000000000000000000000000000000000000000000000000000000000000";
const data = [] ;
const primary = false ;


exports.checkAvailable = async (ensName) => {
    const isAvailable = await registrarContract.available(ensName); // Replace with the actual function you want to call    
    const isExisting = await ens.findOne({ens: ensName,published: true})
    return isAvailable && !isExisting;
} 
exports.getTokenId = async (ensName) => {
      // Compute the label hash (namehash of the label part only, i.e., "example" in "example.eth")
    //   const namehash = keccak256(namehash('eth') + labelhash('ens'))
    //   const labelHash = ethers.keccak256(ethers.toUtf8Bytes(ensName.split('.')[0]));    
    //   const labelHash = ethers.keccak256(ethers.toUtf8Bytes(ensName.split('.')[0]));   
        const labelHash = namehash.hash(ensName+".eth");

    
      // Convert label hash to a uint256 token ID
      const tokenId = ethers.getBigInt(labelHash);
      console.log("tokenId",tokenId);
      return tokenId;
}


exports.getExpiry = async (ensName) => {
    // const tokenId = await this.getTokenId(ensName);
      const labelHash = ethers.keccak256(ethers.toUtf8Bytes(ensName.split('.')[0]));    
    const tokenId = ethers.getBigInt(labelHash);

    const expiry = await baseRegistrarContract.nameExpires(tokenId); // Replace with the actual function you want to call    
    return parseInt(expiry)*1e3
}

exports.getTransferEstimate = async (ensName,recepient) => {
    const tokenId = await this.getTokenId(ensName);
   
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const _nameWrapperContract = new Contract(nameWrapperAddress, nameWrapperAbi, signer);    
const owner = await _nameWrapperContract.ownerOf(tokenId);

    const estimate = await _nameWrapperContract.safeTransferFrom.estimateGas(owner,recepient,tokenId,1,"0x");

    const feeData = await provider.getFeeData()
    const fee = estimate*feeData.gasPrice ;
    
    return fee;
}

exports.getOwner = async (ensName) => {
    const tokenId = await this.getTokenId(ensName);
    const owner = await nameWrapperContract.ownerOf(tokenId);
     return owner
}

exports.checkApproval = async (ensName) => {
    const tokenId = await this.getTokenId(ensName);
    const owner = await nameWrapperContract.ownerOf(tokenId);
    console.log(ensName,tokenId,process.env.DEPLOYER_WALLET);
    const _isApprovedForAll = await nameWrapperContract.isApprovedForAll(owner,process.env.DEPLOYER_WALLET);
    console.log(_isApprovedForAll)
    return _isApprovedForAll;
}

exports.checkValid = async (ensName) => {
    const isValid = await registrarContract.valid(ensName); // Replace with the actual function you want to call    
    return isValid;
}

exports.getPrice = async (ensName) => {
        const getPrice = await registrarContract.rentPrice(ensName,duration); // Replace with the actual function you want to call
        const _price = ethers.formatEther(getPrice[0]);
        return _price;
}

exports.registerEns = async (ensName,address,chatId) => {
    console.log(ensName);
    const isAvailable = await this.checkAvailable(ensName); // Replace with the actual function you want to call    
    console.log("isAvailable",isAvailable);
    
   if(isAvailable){ 
    const getExsting  = await ens.findOne({ens: ensName});
    let _commitHash = null
    if(!getExsting.commitHash){
        _commitHash = await registrarContract.makeCommitment(ensName,address,duration,secret,resolver,data,primary,0); // Replace with the actual function you want to call
        console.log("commitHash",_commitHash);
    }

    const commitHash =   getExsting.commitHash || _commitHash ; 
    
   
    if(commitHash){
        console.log(chatId);       
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const _registrarContract = new Contract(registrarAddress, registrarAbi, signer);    
        let _hash;    
    if(!getExsting.commitHash){
        const txWrap = await _registrarContract.commit(commitHash);        
        const receiptWram = await txWrap.wait();                  
        _hash = txWrap.hash ;  
        const _updated = await ens.findOneAndUpdate(
            { userId: chatId, ens: ensName, published: false },
            {
              $set: {
                commitHash: _hash
              },
            },
            { new: true }
          );

        console.log("Commited: "+_hash);       
    }
    const hash = getExsting.commitHash || _hash
        if(hash){

    setTimeout(async () => {        
            
         const getPrice = await _registrarContract.rentPrice(ensName,duration); // Replace with the actual function you want to call
            const _price = ethers.formatEther(getPrice[0])
            console.log("Price: ",_price );
            console.log("Data: ",ensName,address,duration,secret,resolver,data,primary,0,{value: getPrice[0]} );

         const rtxWrap = await _registrarContract.register(ensName,address,duration,secret,resolver,data,primary,0,{value: getPrice[0]}); // Replace with the actual function you want to call
 
         const rreceiptWram = await rtxWrap.wait();
         // console.log("Unwrapping", receiptWram);
     
         const rhash = rtxWrap.hash ; 
     
         console.log("Registered: ",rhash); 

            const _updated = await ens.findOneAndUpdate(
                { userId: chatId, published: false },
                {
                  $set: {
                    txn: rhash,
                    published: true
                  },
                },
                { new: true }
              );
            return rhash;
    }, 70 * 1000);
}

     return true;
    }
    else{
        return false;
    }
 
   }
}


exports.renewEns = async (ensName) => {
    try{
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const _registrarContract = new Contract(registrarAddress, registrarAbi, signer);           
        const getPrice = await _registrarContract.rentPrice(ensName,duration); // Replace with the actual function you want to call  
        const txWrap = await _registrarContract.renew(ensName,duration,{value: getPrice[0]});        
        const receiptWram = await txWrap.wait();                  
        const hash = txWrap.hash ;  
        return hash; 
    }
    catch(e){
        console.log(e);
        return false;
    }
            
}

exports.getExistingAddress = async (id) =>{
    try{
        const data = await transferTxn.findOne({ensId: id,transferTo: {$ne: null},txn: null});
        return data;
    }
    catch(e){
        console.log(e);
        return false;
    }
}


exports.getExisting = async (id) =>{
    try{
        const data = await transferTxn.findOne({ensId: id,transferTo: null});
        return data;
    }
    catch(e){
        console.log(e);
        return false;
    }
}


// exports.getApprovalEstimate = async (ensName) => {
//  try{

//     const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
//     const _nameWrapperContract = new Contract(nameWrapperAddress, nameWrapperAbi, signer);           
//      const txWrap = await _nameWrapperContract.setApprovalForAll(process.env.DEPLOYER_WALLET,true);        
//     const receiptWram = await txWrap.wait();                  
//     const hash = txWrap.hash ;  
//     return hash; 
// }
// catch(e){
//     console.log(e);
//     return false;
// }

// }


exports.transferEns = async (ensName,recepient,ensId) => {
    try{
   
       const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
       const _nameWrapperContract = new Contract(nameWrapperAddress, nameWrapperAbi, signer);          
       const tokenId = await this.getTokenId(ensName);
        const owner = await _nameWrapperContract.ownerOf(tokenId);
        
        const txWrap = await _nameWrapperContract.safeTransferFrom(owner,recepient,tokenId,1,"0x");;        
       const receiptWram = await txWrap.wait();                  
       const hash = txWrap.hash ;  

       const _updated = await ens.findOneAndUpdate(
        { _id: ensId },
        {
          $set: {
            address: recepient
          },
        },
        { new: true }
      );

      const _updatedT = await transferTxn.findOneAndUpdate(
        { ensId: ensId, txn: null},
        {
          $set: {
            txn: hash
          },
        },
        { new: true }
      );


       return hash; 
   }
   catch(e){
       console.log(e);
       return false;
   }
   
   }


exports.checkTxn = async (txn,ensName) => {
try{
   const transaction = await provider.getTransaction(txn);
   const price  = await this.getPrice(ensName)

   if(process.env.DEPLOYER_WALLET != transaction.to || ethers.formatUnits(transaction.value, 'ether') < price){
        return false;
   }
   else{
    return true
   }

}
catch(e){
    return false;

}

     
}



exports.checkTransferTxn = async (txn,ensName,recepient) => {
    try{
       const transaction = await provider.getTransaction(txn);
       const price  = await this.getTransferEstimate(ensName,recepient)
    
       if(process.env.DEPLOYER_WALLET != transaction.to ||  transaction.value  < price){
            return false;
       }
       else{
        return true
       }
    
    }
    catch(e){
        return false;
    
    }
    
         
    }
exports.checkApprovalTxnHash = async (txn,ensName) => {
    try{
       const transaction = await provider.getTransaction(txn);
       const price  = await this.getApprovalEstimate(ensName)
    
       if(process.env.DEPLOYER_WALLET != transaction.to || ethers.formatUnits(transaction.value, 'ether') < price){
            return false;
       }
       else{
        return true
       }
    
    }
    catch(e){
        return false;
    
    }
    
         
    }

exports.sendTxn = async () => {
    const getEns = await ens.find({ 
        published: false,
        address: { $ne : null},
        paymentHash: { $ne : null},
    })

    if(getEns.length == 0){            
        return;
    }

    getEns.map(async (v,i) => {
         await this.registerEns(v.ens,v.address,v.userId);           
    })

   
}



exports.listTxn = async (chatId) => {
    const getEns = await ens.find({ 
        published: true,
        userId: chatId
    })

    if(getEns.length == 0){            
        return false;
    }

    return getEns;

   
}