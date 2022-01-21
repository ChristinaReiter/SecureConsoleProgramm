import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import https from 'https';
import morgan from 'morgan';
import routes from './routes/server.routes.js';

// certGenerator.server()
// TODO: Remove this from here later
// certGenerator.client('andre')

const opts = {
    key: fs.readFileSync('cert/key_server.pem'),
    cert: fs.readFileSync('cert/cert_server.pem'),
    requestCert: true,
    rejectUnauthorized: false,
    ca: [fs.readFileSync('cert/cert_server.pem')]
}

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(routes);

https.createServer(opts, app).listen(PORT, console.log(`HTTPS Server is running on port ${PORT}`));