const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5000;


const stripe = require('stripe')(process.env.STRIPE_KEY);

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8jrtwg1.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verifyJWT
function verifyJWT (req, res, next) {
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            res.status(403).send({message: 'Forbidden access'});
        }
        req.decoded = decoded;
        next();
    })
}

async function run () {
    try {
        const categoriesCollection = client.db('ResaleFurniture').collection('categories');
        const productsCollection = client.db('ResaleFurniture').collection('products');
        const bookingsCollection = client.db('ResaleFurniture').collection('bookings');
        const usersCollection = client.db('ResaleFurniture').collection('users');
        const paymentsCollection = client.db('ResaleFurniture').collection('payments');


        

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
            res.send(bookings);
        });
        

        // get payment booked product
        app.get('/payment/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await bookingsCollection.findOne(query);
            res.send(result)
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


        // get addProducts data from mongodb
        app.get('/addProducts/:email',  async(req, res) => {
            const email = req.params.email;
            const query = {email: email};
            const products = await productsCollection.find(query).toArray();
            res.send(products.sort().reverse());
        });

        // get Addmin users (rulse)
        app.get('/users/admin/:email', async(req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send( {isAdmin: user?.role === 'admin'} );
        });

        // get sellers (rulse)
        app.get('/users/seller/:email', async(req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const seller = await usersCollection.findOne(query);
            res.send( {isSeller: seller?.option === 'seller'} )
        });

        // get sellers (rulse)
        app.get('/users/user/:email', async(req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send( {isUser: user?.option === 'user'} )
        });


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

        // payment method with stripe 
        app.post('/create-payment-intent', async(req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                  ],
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
              });
        });

        // create payment
        app.post('/payments', async(req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            
            const id = payment.bookingId;
            const filter = {_id: ObjectId(id)};
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updateDoc);

            res.send(result);
        });

        // Update section =========================
        // ========================================

        // update user (make admin by admin)
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


        // sellers verify by admin
        app.put('/users/verify/admin/:id', async(req, res) => {
            
            const id = req.params.id;
            const filter = { _id: ObjectId(id)};
            const options = { upsert: true};
            const updateDoc = {
                $set: {
                    verify: 'verified'
                }
            }

            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });


        // delete user
        app.delete('/users/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });

        // delete my product from client site and mongodb
        app.delete('/addProducts/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await productsCollection.deleteOne(query);
            res.send(result);
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