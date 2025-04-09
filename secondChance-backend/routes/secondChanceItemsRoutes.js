const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images'

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        //connect database
        const db = await connectToDatabase();

        const collection = db.collection("secondChanceItems");
        const secondChanceItems = await collection.find({}).toArray();
        res.json(secondChanceItems);
    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('file') ,async(req, res,next) => {
    try {
        //connect database
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems")

        let secondChanceItem = req.body;

        const lastItemQuery = await collection.find().sort({'id':-1}).limit(1);
        await lastItemQuery.forEach(item => {
            secondChanceItem.id = (parseInt(item.id) + 1).toString();
        });

        const date_added = Math.floor(new Date().getTime()/1000);
        secondChanceItem.date_added = date_added

        secondChanceItem = await collection.insertOne(secondChanceItem);


        res.status(201).json({ _id: result.insertedId, ...secondChanceItem });
    } catch (e) {
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const id = req.params.id;

        const collection = db.collection("secondChanceItems");
        const secondChanceItem = await collection.findOne({id});
        res.json(secondChanceItem);        
    } catch (e) {
        next(e);
    }
});

// Update and existing item
router.put('/:id', async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const id = req.params.id;
        let newsecondChanceItem = req.body

        const collection = db.collection("secondChanceItems");

        const update = await collection.findOneAndUpdate(
            {"id":id},
            {$set:newsecondChanceItem},
            { returnDocument: 'after' }
        );

        res.status(200).json({ message: "Item updated successfully", result });

    } catch (e) {
        next(e);
    }
});

// Delete an existing item
router.delete('/:id', async(req, res,next) => {
    try {
        const db = await this.connectToDatabase();
        const id = req.params.id;

        const collection = db.collection("secondChanceItems");

        const query = await collection.deleteOne({"id":id});

    } catch (e) {
        next(e);
    }
});

module.exports = router;
