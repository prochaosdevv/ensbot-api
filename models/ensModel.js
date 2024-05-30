const mongoose = require('mongoose');

const ensSchema = new mongoose.Schema({
    userId: {
        type: String,
        require: true
    },
    ens: {
        type: String, 
        require: true
    },
    address: {
        type: String,
    },
    txn: {
        type: String, 
    },
    commitHash: {
        type: String, 
    },
    published: {
        type: Boolean, 
    },
    paymentHash: {
        type: String, 
    },
    confirmationSent: {
        type: Boolean
    }
});


const ens = mongoose.model('ens', ensSchema);

module.exports = ens;
