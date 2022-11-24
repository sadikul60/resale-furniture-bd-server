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
        const bookingsCollection = client.db('ResaleFurniture').collection('bookings');

        // get Categoris
        app.get('/categories', async(req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        });

        // get products
        app.get('/products/:id', async(req, res) => {
            const category = req.params.id;
            const query = {categoryId: category};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        // post booking data
        app.post('/bookings', async(req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

        // post booking data
        app.get('/bookings', async(req, res) => {
            const query = {};
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

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