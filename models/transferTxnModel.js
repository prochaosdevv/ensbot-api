const mongoose = require('mongoose');

const transferTxnSchema = new mongoose.Schema({
    userId: {
        type: String,
        require: true
    },
    ensId: {
        type: String,
        require: true
    },
    txn: {
        type: String, 
    },
    transferTo: {
        type: String, 
    }
});


const transferTxn = mongoose.model('transferTxnModel', transferTxnSchema);

module.exports = transferTxn;
