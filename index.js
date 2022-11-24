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

        // get Categoris
        app.get('/categories', async(req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
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