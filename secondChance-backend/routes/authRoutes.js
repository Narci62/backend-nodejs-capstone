const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');
const router = express.Router();
const dotenv = require('dotenv');
const pino = require('pino');  // Import Pino logger
dotenv.config();
const {body, validationResult} = require('express-validator')


const logger = pino();  // Create a Pino logger instance

//Create JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    try {
      //Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
      const db = await connectToDatabase();
      const collection = db.collection("users");
      const existingEmail = await collection.findOne({ email: req.body.email });

        if (existingEmail) {
            logger.error('Email id already exists');
            return res.status(400).json({ error: 'Email id already exists' });
        }

        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);
        const email=req.body.email;
        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        });

        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);
        logger.info('User registered successfully');
        res.json({ authtoken,email });
    } catch (e) {
        logger.error(e);
        return res.status(500).send('Internal server error');
    }
});

router.post('/login', async (req, res) => {
    try {
        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
        const db = await connectToDatabase();
        // Task 2: Access MongoDB `users` collection
        const collection = await db.collection("users");
        // Task 3: Check for user credentials in database
        const theUser = await collection.findOne({email:req.body.email});
        if(theUser){
            let result = await bcryptjs.compare(req.body.password,theUser.password);
            if(!result){
                logger.error('Passwords do not match');
                return res.status(404).json({error:"Wrong password"});
            }

            const userName = theUser.firstName;
            const userEmail = theUser.email;

            let payload = {
                user:{
                    id: theUser._id.toString(),
                },
            }

            const authtoken = jwt.sign(payload, JWT_SECRET);
            logger.info('User logged in successfully');
            return res.status(200).json({authtoken,userName,userEmail})
        }
        else{
            logger.error('User not found');
            return res.status(404).json({error:"User not found"});
        }
    } catch (e) {
         return res.status(500).send('Internal server error');

    }
});


router.put('/update', async (req, res) => {
    // Task 2: Validate the input using `validationResult` and return an appropriate message if you detect an error
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        logger.error('Error for validation update requests',errors.array());
        return res.status(400).json({error:errors.array()});
    }
try {
    // Task 3: Check if `email` is present in the header and throw an appropriate error message if it is not present
    const email = req.headers.email;
    if(!email){
        logger.error("Email not found in query headers")
        return res.status(404).json({error:"Email not found in uery header"});
    }

    // Task 4: Connect to MongoDB
    const db = await this.connectToDatabase();
    const collection = db.collection('users');
    // Task 5: Find the user credentials in database
    const existingUser = await collection.findOne({email});

    existingUser.firstName = req.body.name;
    existingUser.updatedAt = new Date();

    const updateUser = await collection.findOneAndUpdate(
        {email},
        {$set:existingUser},
        {returnDocument:'after'}
    );

    const payload = {
        user:{
            id:updateUser._id.toString(),
        }
    }

    const authtoken=jwt.sign(payload,JWT_SECRET);
    logger.info("User updated successfully");
    
    res.json({authtoken});
} catch (e) {
     return res.status(500).send('Internal server error');

}
});

module.exports = router;