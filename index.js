const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8jrtwg1.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run () {
    try {
        const categoriesCollection = client.db('ResaleFurniture').collection('categories');
        const productsCollection = client.db('ResaleFurniture').collection('products');

        // get Categoris
        app.get('/categories', async(req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        });

        app.get('/products', async(req, res) => {
            const query = {};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        // get products
        app.get('/products/:id', async(req, res) => {
            const category = req.params.id;
            const query = {categoryId: category};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        

    }
    finally {

    }
}

run().catch(err => console.log(err.message))


app.get('/', (req, res) => {
    res.send('Resale Furniture BD is running');
});

app.listen(port, () => {
    console.log(`Server is run on ${port}`);
});