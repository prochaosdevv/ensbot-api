const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const botRotues = express.Router();


const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { checkAvailable, checkValid, registerEns, getPrice, listTxn, renewEns, getExpiry, checkApproval, getApprovalEstimate, checkApprovalTxnHash, getExisting, checkTxn, getTransferEstimate, checkTransferTxn, transferEns, getOwner, getExistingAddress } = require('./controller/ensController');
const ens = require('./models/ensModel');
const { ethers } = require('ethers');
const renewTxn = require('./models/renewTxnModel');
const transferTxn = require('./models/transferTxnModel');
dotenv.config();
// Replace with your Telegram bot token
const token = process.env.TG_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Define your backend service URL
// const BACKEND_URL = "http://your-backend-service.com/api/register_ens";

// Store processed message IDs to prevent double replies
const processedMessages = new Set();
const checkText = "Hi! I am your ENS registration bot. Send me the ENS name you want to check.";
const buyText = "Hi! I am your ENS registration bot. Send me the ENS name you want to buy.";
const updateText = "Hi! I am your ENS registration bot. Please click on the ENS you want to update";

const addressText = "Please send me the wallet address you want to register the ENS with.";
const txnText = "Please send me the payment txn for the ETH you sent.";
 
const renewTxnText = "Please send me the renewal payment txn for the ETH you sent.\n\nID: ";
const transferApprovalTxnText = "Please send me the transfer approval payment txn for the ETH you sent.\n\nID: ";
const transferAddressText = "Please send me the new address where you want to transfer the ENS.\n\nID: ";
const transferTxnText = "Please send me the transfer payment txn for the ETH you sent.\n\nID: ";


botRotues.get('/', async (req, res) => {

    // Matches "/start"
    bot.onText(/\/start/, (msg) => {
        const messageId =   msg.message_id;

        if (processedMessages.has(messageId)) {
            return;
        }
        handleStart(msg)
        processedMessages.add(messageId);

    });


    bot.onText(/\/check/, (msg) => {
        const messageId =   msg.message_id;

        if (processedMessages.has(messageId)) {
            return;
        }
        sendCheckMsg(msg)
        processedMessages.add(messageId);


    });


    bot.onText(/\/buy/, (msg) => { 
        const messageId =   msg.message_id;

        if (processedMessages.has(messageId)) {
            return;
        }

        sendBuyMsg(msg)
        processedMessages.add(messageId);

    });



    bot.onText(/\/update/, (msg) => {
        const messageId =   msg.message_id;

        if (processedMessages.has(messageId)) {
            return;
        }
        sendUpdateMsg(msg)
        processedMessages.add(messageId);

    });





    bot.onText(/\/list/, (msg) => {
        const messageId =   msg.message_id;

        if (processedMessages.has(messageId)) {
            return;
        }
        sendListMsg(msg)
        processedMessages.add(messageId);

    });

    bot.on('callback_query', (callback) => {
        const chatId = callback.message.chat.id;
        const messageId = callback.message.message_id;
        const text = callback.data;
        console.log(text.startsWith("/update_"))
        console.log(text)
        if (processedMessages.has(messageId) && !text.startsWith("/update_") && !text.startsWith("/transfer_") && !text.startsWith("/renew_") && text != "/listBack") {
            return;
        }

        processedMessages.add(messageId);
        if (text == "/list") {
            sendListMsg(callback.message)
        }

        if (text == "/check") {
            sendCheckMsg(callback.message)
        }

        if (text == "/buy") {
            sendBuyMsg(callback.message)
        }

        if (text == "/recordtxn") {
            sendTxnMasg(callback.message)
        }

        if (text.startsWith("/recordtransfertxn_")) {
            const id = text.replace("/recordtransfertxn_","");

            sendTTxnMasg(callback.message,id)
        }

       

        

        if (text.startsWith("/recordapprovaltxn_")) {
            const id = text.replace("/recordapprovaltxn_","");
            // sendTransferApprovalTxnMasg(callback.message,id)
            sendTrannsferMsg(callback.message,id)

        }

        


        if (text.startsWith("/recordrenewtxn_")) {
            const id = text.replace("/recordrenewtxn_","");

            sendRenewTxnMasg(callback.message,id)
        }


        if (text == "/cancelBuy") {
            handleCancel(callback.message)

        }
        if (text == "/cancelrenew") {
            handleCancelRenew(callback.message)

        }

        if (text.startsWith("/cancelretransfer_")) {
            const id = text.replace("/cancelretransfer_","");

            handleCancelTransfer(callback.message,id)

        }

        

        if (text.startsWith("/renew_")) {
            const id = text.replace("/renew_","");

            sendRenewMsg(callback.message,id)
        }

        if (text.startsWith("/transfer_")) {
            const id = text.replace("/transfer_","");

            sendTrannsferMsg(callback.message,id)
        }


        
       

        if (text == "/update") {
            sendUpdateMsg(callback.message)
        }

        if (text == "/listBack") {
            sendListUpdateMsg(callback.message)
        }

        if (text.startsWith("/update_")){
            const id = text.replace("/update_","");
            sendSingleUpdateMsg(callback.message,id)
        }
        


    })

    async function handleStart(msg) {
        const chatId = msg.chat.id;
        const _text = "Hi! I am your ENS registration bot. ";
        const _forceReply = true;
        bot.sendMessage(chatId, _text, {
            "reply_markup": {
                "inline_keyboard":
                    [
                        [
                            {
                                text: "🔎 Check ENS",
                                callback_data: "/check",

                            },
                            {
                                text: "＄ Buy ENS",
                                callback_data: "/buy",
                            },
                        ],
                        [
                            {
                                text: "⚙️ Update ENS",
                                callback_data: "/update",

                            },
                            {
                                text: "📋 List ENS",
                                callback_data: "/list",

                            }
                        ]
                    ]
            },
            parse_mode: 'html',

        });
    }
    async function handleCancelTransfer(msg,id){
        const chatId = msg.chat.id;
        console.log(chatId);
        console.log(msg.message_id);
        await transferTxn.deleteOne({_id:id})
        bot.deleteMessage(chatId,msg.message_id)

    }
    async function handleCancelRenew(msg){
        const chatId = msg.chat.id;
        console.log(chatId);
        console.log(msg.message_id);
        bot.deleteMessage(chatId,msg.message_id)
    }
    async function handleCancel(msg) {
        await ens.deleteOne({
            userId: msg.chat.id,
            published: false
        })
        const chatId = msg.chat.id;

        bot.deleteMessage(chatId,msg.message_id)

        bot.sendMessage(chatId, "Request Deleted", {
            parse_mode: 'markDown',
        });

        handleStart(msg)
    }

    
    
    async function handleTransferApprovalTxn(msg,id) {
        const chatId = msg.chat.id;


        const existing = await ens.findOne(
            { _id: id });

        if (!existing) {
            bot.sendMessage(chatId, "Bad Request. ID not found", {
                parse_mode: 'markDown',
            });
            return;

        }
        const used = await renewTxn.findOne(
            { txn: msg.text });

        if (used) {
            bot.sendMessage(chatId, "Bad Request. Payment Hash Already Used", {
                parse_mode: 'markDown',
            });
            return;
        }

        const usedBuy = await ens.findOne(
            { paymentHash: msg.text });

        if (usedBuy) {
            bot.sendMessage(chatId, "Bad Request. Payment Hash Already Used", {
                parse_mode: 'markDown',
            });
            return;
        }

        const usedTransfer = await transferTxn.findOne(
            { txn: msg.text });

        if (usedTransfer) {
            bot.sendMessage(chatId, "Bad Request. Payment Hash Already Used", {
                parse_mode: 'markDown',
            });
            return;
        }


        const payment = await checkApprovalTxnHash(msg.text, existing.ens)
        if (payment) {

            bot.sendMessage(chatId, "Request Processing...\n\nETA: 1-2 min", {
                parse_mode: 'markDown',
            });


            const renew = await approveForAll(existing.ens)

            if(renew){
                await renewTxn.create(
                    { userId: chatId, txn: msg.text ,ens: existing.ens},              
                );    
            }
            else{
                bot.sendMessage(chatId, "Request Failed. Try again", {
                    parse_mode: 'markDown',
                });
                return;
            }
           

         


        }
        else {
            bot.sendMessage(chatId, "Request Failed.\n\Please retry.\n\nPlease check payment hash not used and correct ", {
                parse_mode: 'markDown',
            });
            initiateBuy(msg)
        }
    }

    async function handleTransferTxn(msg,id) {
        const chatId = msg.chat.id;


        const existing = await transferTxn.findOne(
            { _id: id });

        if (!existing) {
            bot.sendMessage(chatId, "Bad Request. ID not found", {
                parse_mode: 'markDown',
            });
            return;

        }
        const used = await renewTxn.findOne(
            { txn: msg.text });

        if (used) {
            bot.sendMessage(chatId, "Bad Request. Payment Hash Already Used", {
                parse_mode: 'markDown',
            });
            return;
        }

        const usedBuy = await ens.findOne(
            { paymentHash: msg.text });

        if (usedBuy) {
            bot.sendMessage(chatId, "Bad Request. Payment Hash Already Used", {
                parse_mode: 'markDown',
            });
            return;
        }

        const usedTransfer = await transferTxn.findOne(
            { txn: msg.text });

        if (usedTransfer) {
            bot.sendMessage(chatId, "Bad Request. Payment Hash Already Used", {
                parse_mode: 'markDown',
            });
            return;
        }
        const getEns = await ens.findOne(
            { _id: existing.ensId });

        const payment = await checkTransferTxn(msg.text,getEns.ens, existing.transferTo)
        if (payment) {

            bot.sendMessage(chatId, "Request Processing...\n\nETA: 1-2 min", {
                parse_mode: 'markDown',
            });


            const transferHash = await transferEns(getEns.ens,existing.transferTo,getEns._id)

            if(transferHash){
                bot.sendMessage(chatId, "Transfer Successful. Hash: "+transferHash, {
                    parse_mode: 'markDown',
                });
                return;
            }
            else{
                bot.sendMessage(chatId, "Request Failed. Try again", {
                    parse_mode: 'markDown',
                });
                return;
            }        

        }
        else {
            bot.sendMessage(chatId, "Request Failed.\n\Please retry.\n\nPlease check payment hash not used and correct ", {
                parse_mode: 'markDown',
            });
            initiateBuy(msg)
        }
    }
    async function handleRenewTxn(msg,id) {
        const chatId = msg.chat.id;


        const existing = await ens.findOne(
            { _id: id });

        if (!existing) {
            bot.sendMessage(chatId, "Bad Request. ID not found", {
                parse_mode: 'markDown',
            });
            return;

        }
        const used = await renewTxn.findOne(
            { txn: msg.text });

        if (used) {
            bot.sendMessage(chatId, "Bad Request. Payment Hash Already Used", {
                parse_mode: 'markDown',
            });
            return;
        }

        const usedBuy = await ens.findOne(
            { paymentHash: msg.text });

        if (usedBuy) {
            bot.sendMessage(chatId, "Bad Request. Payment Hash Already Used", {
                parse_mode: 'markDown',
            });
            return;
        }

        const usedTransfer = await transferTxn.findOne(
            { txn: msg.text });

        if (usedTransfer) {
            bot.sendMessage(chatId, "Bad Request. Payment Hash Already Used", {
                parse_mode: 'markDown',
            });
            return;
        }


        const payment = await checkTxn(msg.text, existing.ens)
        if (payment) {

            bot.sendMessage(chatId, "Request Processing...\n\nETA: 1-2 min", {
                parse_mode: 'markDown',
            });


            const renew = await renewEns(existing.ens)

            if(renew){
                bot.sendMessage(chatId, "Renewal Successfull.", {
                    parse_mode: 'markDown',
                });
                await renewTxn.create(
                    { userId: chatId, txn: msg.text ,ens: existing.ens},              
                );    
            }
            else{
                bot.sendMessage(chatId, "Request Failed. Try again", {
                    parse_mode: 'markDown',
                });
                return;
            }
           

         


        }
        else {
            bot.sendMessage(chatId, "Request Failed.\n\Please retry.\n\nPlease check payment hash not used and correct ", {
                parse_mode: 'markDown',
            });
            initiateBuy(msg)
        }
    }

    async function handleTxn(msg) {
        const chatId = msg.chat.id;


        const used = await ens.findOne(
            { paymentHash: msg.text });

        if (used) {
            bot.sendMessage(chatId, "Bad Request. Payment Hash Already Used", {
                parse_mode: 'markDown',
            });
        }


      


        const existing = await ens.findOne(
            { userId: chatId, published: false, paymentHash: null });

        if (!existing) {
            bot.sendMessage(chatId, "Bad Request.", {
                parse_mode: 'markDown',
            });
        }



        const payment = await checkTxn(msg.text, existing.ens)
        if (payment) {

            await ens.findOneAndUpdate(
                { userId: chatId, published: false },
                {
                    $set: {
                        paymentHash: msg.text,
                    },
                },
                { new: true }
            );


            bot.sendMessage(chatId, "Request Processing...\n\nETA: 2-5 min", {
                parse_mode: 'markDown',
            });



        }
        else {
            bot.sendMessage(chatId, "Request Failed.\n\Please retry.\n\nPlease check payment hash not used and correct ", {
                parse_mode: 'markDown',
            });
            initiateBuy(msg)
        }

    }



    async function sendBuyMsg(msg) {
        const chatId = msg.chat.id;
        const _forceReply = true;
        bot.sendMessage(chatId, buyText, {
            "reply_markup": {
                force_reply: _forceReply,
                input_field_placeholder: 'enter domain like test'
            },
            parse_mode: 'markDown',

        });
    }

    async function sendUpdateMsg(msg){
        sendListMsg(msg)
    }

    async function sendSingleUpdateMsg(msg,id){
        const chatId = msg.chat.id;
        const getEns = await ens.findOne({_id: id})
    
        const expiresAt = await getExpiry(getEns.ens); 
        const owner = await getOwner(getEns.ens)
        bot.editMessageReplyMarkup(JSON.stringify({ // Added JSON.stringify()
            inline_keyboard: [
                [
                    {
                        text: getEns.ens,
                        callback_data: "/nothing",
                    }                    
                ],
                [
                    {
                        text: "Expires on: "+new Date(expiresAt).toDateString(),
                        callback_data: "/nothing",
                    }  
                ],
                [
                    {
                        text: "Owner: "+owner,
                        callback_data: "/nothing",
                    }  
                ],
                [
                {
                    text: "🔄 Transfer ENS",
                    callback_data: "/transfer_"+id,

                },
                {
                    text: "🔂 Renew ENS",
                    callback_data: "/renew_"+id,

                }
            ],
        [
            {
                text: "⬅️ Go Back",
                callback_data: "/listBack",
            }
        ]]
        }), {
            chat_id: chatId,
            message_id: msg.message_id
        })
         
    }
     
    async function sendTransferApprovalTxnMasg(msg,id) {
        const chatId = msg.chat.id;
        bot.editMessageReplyMarkup(JSON.stringify({ // Added JSON.stringify()
            inline_keyboard: [[]]
        }), {
            chat_id: chatId,
            message_id: msg.message_id
        })
        const _forceReply = true;
        bot.sendMessage(chatId, transferApprovalTxnText+id, {
            "reply_markup": {
                force_reply: _forceReply,
                input_field_placeholder: 'enter hash like 0x...'
            },
            parse_mode: 'markDown',
        });
    }

    async function sendRenewTxnMasg(msg,id) {
        const chatId = msg.chat.id;
        bot.editMessageReplyMarkup(JSON.stringify({ // Added JSON.stringify()
            inline_keyboard: [[]]
        }), {
            chat_id: chatId,
            message_id: msg.message_id
        })
        const _forceReply = true;
        bot.sendMessage(chatId, renewTxnText+id, {
            "reply_markup": {
                force_reply: _forceReply,
                input_field_placeholder: 'enter hash like 0x...'
            },
            parse_mode: 'markDown',
        });
    }
    
    async function sendTTxnMasg(msg,id) {
        const chatId = msg.chat.id;
        bot.editMessageReplyMarkup(JSON.stringify({ // Added JSON.stringify()
            inline_keyboard: [[]]
        }), {
            chat_id: chatId,
            message_id: msg.message_id
        })
        const _forceReply = true;
        bot.sendMessage(chatId, transferTxnText+id, {
            "reply_markup": {
                force_reply: _forceReply,
                input_field_placeholder: 'enter hash like 0x...'
            },
            parse_mode: 'markDown',
        });
    }

    async function sendTxnMasg(msg) {
        const chatId = msg.chat.id;
        bot.editMessageReplyMarkup(JSON.stringify({ // Added JSON.stringify()
            inline_keyboard: [[]]
        }), {
            chat_id: chatId,
            message_id: msg.message_id
        })
        const _forceReply = true;
        bot.sendMessage(chatId, txnText, {
            "reply_markup": {
                force_reply: _forceReply,
                input_field_placeholder: 'enter hash like 0x...'
            },
            parse_mode: 'markDown',
        });
    }
    async function sendCheckMsg(msg) {
        const chatId = msg.chat.id;

        const _forceReply = true;
        bot.sendMessage(chatId, checkText, {
            "reply_markup": {
                force_reply: _forceReply,
                input_field_placeholder: 'enter domain like test'
            },
            parse_mode: 'markDown',
        });
    }

    
    async function sendListUpdateMsg(msg) {
        const chatId = msg.chat.id;
        
        const _keyboard = await getEnsList(chatId)
        bot.editMessageReplyMarkup(JSON.stringify({ // Added JSON.stringify()
            inline_keyboard: _keyboard
        }), {
            chat_id: chatId,
            message_id: msg.message_id
        })
    }

    async function sendListMsg(msg) {
        const chatId = msg.chat.id;
        const _text = "Hi! I am your ENS registration bot. Below you can find list of all your registered ENS.\n\nYou can click on the ENS you want to update.";
        const _forceReply = true;
        const _keyboard = await getEnsList(chatId)
        bot.sendMessage(chatId, _text, {
            "reply_markup": {
                inline_keyboard: _keyboard,
            },
            parse_mode: 'markDown',
        });
    }

    async function getEnsList(chatId){
        const list = await listTxn(chatId);
        let _keyboard = []
        if(list){
            list.map((v,i) => {
                _keyboard.push([
                    {
                        text: v.ens,
                        callback_data: "/update_"+v._id,
    
                    }]
                )
            })
           
        }
        return _keyboard;
    }
    
    async function sendTransferAddressReply(msg,id){
        const chatId = msg.chat.id;
        
        console.log(id);
        const checkExisting = await transferTxn.findOne({
            _id: id
        })

        if (!checkExisting) {
            const _text = "Bad Request. Retry."
            bot.sendMessage(chatId, _text, {
                parse_mode: 'markDown',
            });
            return;
        }
        
        const _updated = await transferTxn.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    transferTo: msg.text
                },
            },
            { new: true }
        );

        sendTrannsferMsg(msg,checkExisting.ensId)

    }

    async function sendTrannsferMsg(msg,id){
        const chatId = msg.chat.id;

        const checkExisting = await ens.findOne({
            _id: id
        })

        if (!checkExisting) {
            const _text = "Bad Request. Retry."
            bot.sendMessage(chatId, _text, {
                parse_mode: 'markDown',
            });
            return;
        }

        const ensName = checkExisting.ens ;
        const wallet = process.env.DEPLOYER_WALLET

        const isApprovedForAll  = await checkApproval(ensName);
        if(!isApprovedForAll){

        const estimategas = await getApprovalEstimate(ensName);
        const link = process.env.EXPLORER_URL + process.env.NAME_WRAPPER_CONTRACT
        const _text = "In order to perform transfer request we need your approval.\n\nPlease go to  "+link+" and execute setApprovalForAll function with values\n\nOperator: " + wallet + "\n\nApproved: true.\n\nOnce you complete please click on ⏩ Continue button below.";
        bot.sendMessage(chatId, _text, {

            "reply_markup": {
                "inline_keyboard":
                    [
                        [
                            {
                                text: "⏩ Continue",
                                callback_data: "/recordapprovaltxn_"+id,

                            },
                            {
                                text: "❌ Cancel",
                                callback_data: "/cancelrenew",
                            },
                        ]
                    ]
            },
            parse_mode: 'html',
        });
        return;
        }

        const checkExistingRequest = await getExisting(id)
        const checkExistingAddress = await getExistingAddress(id)
        console.log(checkExistingRequest);
        

        if (!checkExistingRequest && !checkExistingAddress) {
            console.log("here");

           
            const created = await transferTxn.create({
                userId: chatId,
                ensId: id
            })
            const _forceReply = true;
            bot.sendMessage(chatId, transferAddressText+created._id, {
                "reply_markup": {
                    force_reply: _forceReply,
                    input_field_placeholder: 'enter hash like 0x...'
                },
                parse_mode: 'markDown',
            });


            return
        }

        if(!checkExistingAddress){
            const _forceReply = true;
            bot.sendMessage(chatId, transferAddressText+checkExistingRequest._id, {
                "reply_markup": {
                    force_reply: _forceReply,
                    input_field_placeholder: 'enter hash like 0x...'
                },
                parse_mode: 'markDown',
            });


            return
        }


        let transferId = checkExistingAddress._id
 
        console.log("here 2");
         

 
       




        const cost = await getTransferEstimate(ensName,checkExistingAddress.transferTo);


        const _text = "\n\nCost: " + ethers.formatEther(cost) + " ETH.\n\nPlease send to wallet:\n" + wallet + ".\n\nOnce you send please click on ⏩ Continue button below.";

        bot.sendMessage(chatId, _text, {

            "reply_markup": {
                "inline_keyboard":
                    [
                        [
                            {
                                text: "⏩ Continue",
                                callback_data: "/recordtransfertxn_"+transferId,

                            },
                            {
                                text: "❌ Cancel",
                                callback_data: "/cancelretransfer_"+transferId,
                            },
                        ]
                    ]
            },
            parse_mode: 'html',
        });

        

    }


    async function sendRenewMsg(msg,id){
        const chatId = msg.chat.id;

        const checkExisting = await ens.findOne({
            _id: id
        })

        if (!checkExisting) {
            const _text = "Bad Request. Retry."
            bot.sendMessage(chatId, _text, {
                parse_mode: 'markDown',
            });
            return;
        }

        const ensName = checkExisting.ens
        const cost = await getPrice(ensName);
        const wallet = process.env.DEPLOYER_WALLET


        const _text = "\n\nCost: " + cost + " ETH.\n\nPlease send to wallet:\n" + wallet + ".\n\nOnce you send please click on ⏩ Continue button below.";

        bot.sendMessage(chatId, _text, {

            "reply_markup": {
                "inline_keyboard":
                    [
                        [
                            {
                                text: "⏩ Continue",
                                callback_data: "/recordrenewtxn_"+id,

                            },
                            {
                                text: "❌ Cancel",
                                callback_data: "/cancelrenew",
                            },
                        ]
                    ]
            },
            parse_mode: 'html',
        });

    }
    async function initiateBuy(msg) {
        const chatId = msg.chat.id;

        const checkExisting = await ens.findOne({
            userId: msg.chat.id,
            published: false,
            address: { $ne: null }
        })
        if (!checkExisting) {
            const _text = "Please restart the process as no request exists for you."
            bot.sendMessage(chatId, _text, {
                parse_mode: 'markDown',
            });
            return;
        }


        const ensName = checkExisting.ens;
        const isValid = await checkValid(ensName);
        if (!isValid) {
            const _text = ensName + " is not valid"
            bot.sendMessage(chatId, _text, {
                parse_mode: 'markDown',
            });
            return;
        }

        const cost = await getPrice(ensName);
        const wallet = process.env.DEPLOYER_WALLET



        const _text = ensName + " is available.\n\nCost: " + cost + " ETH.\n\nPlease send to wallet:\n" + wallet + ".\n\nOnce you send please click on ⏩ Continue button below.";

        bot.sendMessage(chatId, _text, {

            "reply_markup": {
                "inline_keyboard":
                    [
                        [
                            {
                                text: "⏩ Continue",
                                callback_data: "/recordtxn",

                            },
                            {
                                text: "❌ Cancel",
                                callback_data: "/cancelBuy",
                            },
                        ]
                    ]
            },
            parse_mode: 'html',
        });
    }


    async function checkEns(msg, ensName) {
        const chatId = msg.chat.id;
        const isValid = await checkValid(ensName);
        if (!isValid) {
            const _text = ensName + " is not valid"
            bot.sendMessage(chatId, _text, {
                parse_mode: 'markDown',
            });
            return;
        }
        const isAvailable = await checkAvailable(ensName)
        const _text = ensName + " is " + (isAvailable ? "" : "not ") + "available"
        bot.sendMessage(chatId, _text, {
            parse_mode: 'markDown',
        });
    }



    async function sendAddressMsg(msg) {
        const chatId = msg.chat.id;
        const _forceReply = true;
        bot.sendMessage(chatId, addressText, {
            "reply_markup": {
                force_reply: _forceReply,
                input_field_placeholder: 'enter wallet address 0x...'
            },
            parse_mode: 'markDown',

        });
    }

    // Listen for any kind of message
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const messageId = msg.message_id;
        const text = msg.text;

        // Ignore commands and messages already processed
        if (text.startsWith('/') || processedMessages.has(messageId)) {
            return;
        }
        processedMessages.add(messageId);

        if (msg.reply_to_message?.text == checkText) {
            checkEns(msg, text)
        }

        if (msg.reply_to_message?.text == txnText) {
            handleTxn(msg)
        }

        if (msg.reply_to_message?.text.startsWith(renewTxnText)) {
            const id = msg.reply_to_message.text.replace(renewTxnText,"");

            handleRenewTxn(msg,id)
        }

        // if (msg.reply_to_message.text.startsWith(transferApprovalTxnText)) {
        //     const id = msg.reply_to_message.text.replace(transferApprovalTxnText,"");

        //     handleTransferApprovalTxn(msg,id)
        // }

        

        if (msg.reply_to_message?.text == buyText) {


            const isAvailable = await checkAvailable(text)
            if (!isAvailable) {
                const _text = text + " is not available"
                bot.sendMessage(chatId, _text, {
                    parse_mode: 'markDown',
                });
                return;
            } 


            const checkExisting = await ens.findOne({
                userId: msg.chat.id,
                published: false,
                paymentHash: null
            })

            if (checkExisting) {
                const _text = "There is already another request pending in your account. Please either continue the previous registration or cancel it.";
                bot.sendMessage(chatId, _text, {
                    "reply_markup": {
                        "inline_keyboard":
                            [
                                [
                                    {
                                        text: "❌ Cancel",
                                        callback_data: "/cancelBuy",
                                    },
                                ]
                            ]
                    },
                    parse_mode: 'html',
                });
                if (checkExisting.address) {
                    initiateBuy(msg)
                }
                else {
                    sendAddressMsg(msg);
                }
                return;
            }

            await ens.create({
                userId: msg.chat.id,
                published: false,
                ens: text
            })
            sendAddressMsg(msg)
        }
        if (msg.reply_to_message?.text.startsWith(transferAddressText)){
            const id = msg.reply_to_message.text.replace(transferAddressText,"");
            const checkAddress = ethers.isAddress(text);
            console.log(checkAddress);
            if(checkAddress){
            sendTransferAddressReply(msg,id)
        }
        else {

            bot.sendMessage(chatId, "Request Failed.\n\Please enter valid address ", {
                parse_mode: 'markDown',
            });
            console.log(id);
            sendTrannsferMsg(msg,id)
        }
        }


        if (msg.reply_to_message?.text.startsWith(transferTxnText)){
            const id = msg.reply_to_message.text.replace(transferTxnText,"");
            handleTransferTxn(msg,id)
        }
        if (msg.reply_to_message.text == addressText) {

            const checkAddress = ethers.isAddress(text)
            if (checkAddress) {

                const _updated = await ens.findOneAndUpdate(
                    { userId: chatId, published: false },
                    {
                        $set: {
                            address: text,
                        },
                    },
                    { new: true }
                );


                initiateBuy(msg);



            }
            else {

                bot.sendMessage(chatId, "Request Failed.\n\Please enter valid address ", {
                    parse_mode: 'markDown',
                });
                sendAddressMsg(msg)
            }


        }

        // Add the message ID to the processed set
 

    });


});




const sendConfirmation = async () => {

    const getEns = await ens.find({
        confirmationSent: null,
        txn: { $ne: null },
    })
     
    getEns.map(async (v, i) => {
        bot.sendMessage(v.userId, "Request Successful for ENS resgitration.\n\nENS: " + v.ens + "\n\nTxn hash: " + v.txn, {
            parse_mode: 'markDown',
        });
        await ens.findOneAndUpdate(
            { _id: v._id,  },
            {
                $set: {
                    confirmationSent: true
                },
            },
            { new: true }
        );
    })


}


setInterval(() => {
    sendConfirmation()
}, 3000);


module.exports = botRotues; // Export the router
