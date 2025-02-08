const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 8080;

app.use(cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'frontend.html'));
});

app.listen(port, () => {
    console.log(`Frontend server running on http://localhost:${port}/frontend.html`);
});
