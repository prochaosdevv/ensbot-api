const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const botRotues = require('./botRoutes');
  
dotenv.config();
 
const connectDatabase = require('./utils/dbConnection'); 
const { sendTxn } = require('./controller/ensController'); 

connectDatabase(); 

const app = express ();
app.use(cors({
    origin: "*", // Replace with your allowed origins
}));
app.use(express.json());
const PORT = process.env.PORT || 3000;


app.use("/status", (req,res) => {
    res.send({statu: true})
});

    sendTxn() 
setInterval(() => {
    sendTxn()
}, 3 * 60000);

app.use("/", botRotues);


 
const url = 'https://d3kfm3vrotemri.cloudfront.net'
console.log(`https://api.telegram.org/bot${process.env.TG_TOKEN}/setWebhook?url=${url}`);

 
app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});