const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8jrtwg1.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verifyJWT
// function verifyJWT (req, res, next) {
//     const authHeader = req.headers.authorization;

//     if(!authHeader){
//         return res.status(401).send('unauthorized access');
//     }

//     const token = authHeader.split(' ')[1];
    
//     jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
//         if(err){
//             res.status(403).send({message: 'Forbidden access'});
//         }
//         req.decoded = decoded;
//         next();
//     })
// }

async function run () {
    try {
        const categoriesCollection = client.db('ResaleFurniture').collection('categories');
        const productsCollection = client.db('ResaleFurniture').collection('products');
        const bookingsCollection = client.db('ResaleFurniture').collection('bookings');
        const usersCollection = client.db('ResaleFurniture').collection('users');


        

        // data get section=========================
        // =========================================
        // get Categoris from mongodb
        app.get('/categories', async(req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        });

        // get products from mongodb (productsCollection from categoris to query specific id)
        app.get('/categories/:id', async(req, res) => {
            const category = req.params.id;
            const query = {categoryId: category};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        // get bookings data from mongodb
        app.get('/bookings/:email',  async(req, res) => {
            const email = req.params.email;
            const query = {email: email};
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings.sort().reverse());
        });

        // Get jwt (user)
        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = { email: email};
            const user = await usersCollection.findOne(query);
            
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '7d'});
                return res.send({accessToken: token});
            }
            res.status(403).send({accessToken: ''})
        });

        // get users (All Sellers) data from mongodb
        app.get('/users/:option', async(req, res) => {
            const option = req.params.option;
            const query = {option: option};
            const users = await usersCollection.find(query).toArray();
            res.send(users.sort().reverse());
        });

        // get users (All Buyers) data from mongodb
        app.get('/users/:option', async(req, res) => {
            const option = req.params.option;
            const query = {option: option};
            const users = await usersCollection.find(query).toArray();
            res.send(users.sort().reverse());
        });

        // get all Users data from mongodb
        app.get('/users', async(req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        // get Addmin users
        app.get('/users/admin/:email', async(req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send( {isAdmin: user?.role === 'admin'} );
        })


        // get addProducts data from mongodb
        app.get('/addProducts',  async(req, res) => {
            const email = req.query.email;

            const decodedEmail = req.decoded.email;

            if(email !== decodedEmail){
                return res.status(403).send({message: 'Forbidden access'});
            }

            const query = {email: email};
            const products = await productsCollection.find(query).toArray();
            res.send(products.sort().reverse());
        })


        // data post section=========================
        // =========================================
        // post from client site and stored mongobd booking data
        app.post('/bookings', async(req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });


        // post from client site and stored mongodb users data
        app.post('/users', async(req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // post from clint site and stored mongodb addProduct
        app.post('/addProduct', async(req, res) => {
            const addProduct = req.body;
            const result = await productsCollection.insertOne(addProduct);
            res.send(result);
        });

        // Update section =========================
        // ========================================

        // update user
        app.put('/users/admin/:id', async(req, res) => {
            
            const id = req.params.id;
            const filter = { _id: ObjectId(id)};
            const options = { upsert: true};
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }

            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });


        // delete user
        // Rap
        app.delete('/users/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await usersCollection.deleteOne(query);
            res.send(result);
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