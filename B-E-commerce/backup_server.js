
import express from 'express';
const app = express();
const port = 3002;

import fs from 'fs';
import cors from 'cors';


app.use(express.json())
app.use(cors())
app.get('/', (req, res) => {
    res.send('Hello, World!');
});
//----------------- Database management -------------------//
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
//----------------- Products -------------------//



// route GET /products - get the list of all product (and can be filtered)
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


// Route GET /products/:id - Get a product by an id
app.get('/products/:id', (req, res) => {
    const db = readData()
    const productId = parseInt(req.params.id);
    const product = db.products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
});

// route POST /products - create a product
app.post('/products', (req, res) => {
    const { name, description, price, category, inStock } = req.body;
    if (!name || !description || !price || !category || inStock === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const db = readData()
    const newProduct = {
        id: db.products.length + 1,
        name,
        description,
        price,
        category,
        inStock
    };

    db.products.push(newProduct);
    writeData(db)
    res.status(201).json(newProduct);
});

// route PUT /products/id - update the product
app.put('/products/:id', (req, res) => {
    const db = readData()
    const productId = parseInt(req.params.id);
    const product = db.products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    const { name, description, price, category, inStock } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (inStock !== undefined) product.inStock = inStock;

    writeData(db);

    res.json(product);
});

//route DELETE /products/id - delete the product
app.delete('/products/:id', (req, res) => {
    const db = readData();
    const productId = parseInt(req.params.id);
    const productIndex = db.products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
        return res.status(404).json({ error: "Product not found" });
    }

    db.products.splice(productIndex, 1);
    writeData(db)
    res.json({ message: "Product successfully deleted" });
});


//----------------- ORDERS -------------------//


//route POST /orders - Create a new order
app.post('/orders', (req, res) => {
    const { products: orderedProducts, user } = req.body;

    const db = readData();

    if (!orderedProducts || !Array.isArray(orderedProducts) || orderedProducts.length === 0) {
        return res.status(400).json({ error: "No products specified in the order" });
    }

    let totalPrice = 0;
    const orderedDetails = [];

    for (let orderItem of orderedProducts) {
        const product = db.products.find(p => p.id === orderItem.productId);

        if (!product) {
            return res.status(404).json({ error: `Product with ID ${orderItem.productId} not found` });
        }

        if (!product.inStock) {
            return res.status(400).json({ error: `Product ${product.name} is out of stock` });
        }

        const quantity = orderItem.quantity;

        totalPrice += product.price * quantity;

        orderedDetails.push({
            productId: product.id,
            name: product.name,
            quantity,
            price: product.price,
            total: product.price * quantity
        });
    }

    const order = {
        id: db.orders.length + 1,
        user: user || null,
        products: orderedDetails,
        totalPrice,
        status: 'Pending'
    };

    db.orders.push(order);
    writeData(db);
    res.status(201).json(order);
});

// Route get /orders/userId - Get the orders of a user by his id
app.get('/orders/:userId', (req, res) => {
    const userId = req.params.userId;
    const db = readData();

    const userOrders = db.orders.filter(order => order.user === userId);

    if (userOrders.length === 0) {
        return res.status(404).json({ error: "No orders found for this user" });
    }

    res.json(userOrders);
});

//----------------- CART -------------------//


//Route POST /carts/userId - add a product in the user's cart
app.post('/cart/:userId', (req, res) => {
    const userId = req.params.userId;
    const { productId, quantity } = req.body;
    const db = readData();
    const product = db.products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    if (!product.inStock) {
        return res.status(400).json({ error: `Product ${product.name} is out of stock` });
    }

    //find or create a cart for the user
    let cart = db.carts.find(c => c.userId === userId);

    if (!cart) {
        cart = {
            userId,
            items: [],
            totalPrice: 0
        };
        db.carts.push(cart);
    }

    const cartItem = cart.items.find(item => item.productId === productId);

    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        cart.items.push({
            productId,
            quantity
        });
    }

    cart.totalPrice = cart.items.reduce((total, item) => {
        const product = db.products.find(p => p.id === item.productId);
        return total + (product.price * item.quantity);
    }, 0);

    writeData(db);

    res.json(cart);
});

//route GET /cart/userId - get the shopping cart of a user
app.get('/cart/:userId', (req, res) => {
    const userId = req.params.userId;
    const db = readData();
    const cart = db.carts.find(c => c.userId === userId);

    if (!cart) {
        return res.status(404).json({ error: "Cart not found for this user" });
    }

    cart.totalPrice = cart.items.reduce((total, item) => {
        const product = db.products.find(p => p.id === item.productId);
        return total + (product.price * item.quantity);
    }, 0);

    res.json(cart);
});


//route DELETE /cart/userId/item/productId - delete a product from the user's cart
app.delete('/cart/:userId/item/:productId', (req, res) => {
    const userId = req.params.userId;
    const productId = parseInt(req.params.productId);
    const db = readData();
    const cart = db.carts.find(c => c.userId === userId);

    if (!cart) {
        return res.status(404).json({ error: "Cart not found for this user" });
    }

    const productIndex = cart.items.findIndex(item => item.productId === productId);

    if (productIndex === -1) {
        return res.status(404).json({ error: "Product not found in cart" });
    }

    cart.items.splice(productIndex, 1);

    cart.totalPrice = cart.items.reduce((total, item) => {
        const product = db.products.find(p => p.id === item.productId);
        return total + (product.price * item.quantity);
    }, 0);

    writeData(db);

    res.json(cart);
});



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
