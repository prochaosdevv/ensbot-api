const mongoose = require('mongoose');

const renewTxnSchema = new mongoose.Schema({
    userId: {
        type: String,
        require: true
    },
    txn: {
        type: String, 
    },
    ens: {
        type: String, 
    }
});


const renewTxn = mongoose.model('renewTxn', renewTxnSchema);

module.exports = renewTxn;
