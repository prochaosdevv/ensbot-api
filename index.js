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
}, 5 * 60000);

app.use("/", botRotues);


 
const url = 'https://1dcc-2401-4900-1c75-3c8b-5c80-925a-255a-be16.ngrok-free.app'
console.log(`https://api.telegram.org/bot${process.env.TG_TOKEN}/setWebhook?url=${url}/bot`);

 
app.listen(PORT, () => {
    // console.log("Server Listening on PORT:", PORT);
});