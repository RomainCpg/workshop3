# B - E-commerce - Importance of redundancy



## Q1 - Create a Simple Hello World Server



```javascript
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
```

## Q2 - Create a DNS Registry

I created a DNS registry in ```dnsRegistry.js```implemented as an Express server, with a getServer route, which responds with the URL of the e-commerce serveur.

```javascript
const express = require('express');
const app = express();
const port = 3001;

app.get('/getServer', (req, res) => {
    res.json({ code: 200, server: `localhost:3000` });
});

app.listen(port, () => {
    console.log(`DNS Registry running on http://localhost:${port}`);
});

```

## Q3 - Database implementation

For storing data, i used a JSON-based database. I used ```fs``` module to read and write to a ```db.json````file.

Here the part to read and write the data.
```javascript
const filePath = './db.json';

const readData = () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error when trying to read the JSON', err);
        return { products: [], orders: [], carts: [] };
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Donnes saved');
    } catch (err) {
        console.error('Error when trying to write the JSON', err);
    }
};
```

## Q4 - Modify the server implementation to match API requirements.

Here an exemple of a get route on the products :

````javascript
app.get('/products', (req, res) => {
    const db = readData()
    let filteredProducts = db.products;

    if (req.query.category) {
        filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === req.query.category.toLowerCase());
    }
    if (req.query.inStock) {
        const inStockFilter = req.query.inStock.toLowerCase() === 'true';
        filteredProducts = filteredProducts.filter(p => p.inStock === inStockFilter);
    }

    res.json(filteredProducts);
});
````

## Q5 - Create a simple front end
For this question, i have created a frontend in one page only.
The frontend is on server, but can be used without it, just by launching the ```frontend.html``` file.

We can : 
- display the product list
- add a product
- add a product to the shopping cart
- display the shopping cart
- make an order

## Q6 - Simulate an issue of the API Server

To handle issue of the API Server, i have created a second server, similar to the first one. 
Secondly, the DNS getServer route will now respond with an available server only. 

Here the code for the DNS server. 
````javascript
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
````
Then, the frontend get the server given by the dns and use it. 