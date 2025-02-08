import express from 'express';

import axios from 'axios';
import cors from "cors";

const app = express();
const port = 3001;

app.use(cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json())

const servers = [
    'http://localhost:3000', // main server
    'http://localhost:3002'  // backup serveur
];

// check the availibity of a server
async function checkServer(url) {
    try {
        await axios.get(url);
        return true;
    } catch (error) {
        return false;
    }
}

app.get('/getServer', async (req, res) => {
    for (let server of servers) {
        if (await checkServer(server)) {
            return res.json({ code: 200, server });
        }
    }
    res.status(500).json({ code: 500, message: 'No available servers' });
});

app.listen(port, () => {
    console.log(`DNS Registry running on http://localhost:${port}`);
});
