const express = require('express');
const booksRouter = express.Router();
const Book = require('./bookModel');
const mongoose = require('mongoose');

booksRouter.get('/', async(request, response) => {
    Book.find()
    .then(result => {
        response.status(200).json({
            books: result
        });
    })
    .catch(error => {
        response.send(404).json({
            error: "book not found"
        })
    });
});

booksRouter.get('/:id', async(request, response) => {
    Book.findById(request.params.id)
    .then(result => {
        response.status(200).json({
            book: result
        });
    })
    .catch(error => {
        response.status(404).json({
            error: "book not found"
        });
    });
});

booksRouter.post('/', async(request, response) => {
    const book = new Book({
        _id: new mongoose.Types.ObjectId,
        title: request.body.title,
        author: request.body.author,
        summary: request.body.summary
    });

    book.save()
    .then(result => {
        response.status(200).json({
            newBook: result
        })
    })
    .catch(error => {
        response.status(400).json({
            error: "error in adding book"
        })
    });
});

booksRouter.put('/:id', async(request, response) => {
    Book.findOneAndUpdate({_id: request.params.id}, {
        $set: {
            title: request.body.title,
            author: request.body.author,
            summary: request.body.summary
        }
    })
    .then(result => {
        response.status(200).json({
            message: "book updated"
        });
    })
    .catch(error => {
        response.status(404).json({
            error: "book not found"
        });
    });
});

booksRouter.delete('/:id', async(request, response) => {
    Book.findOneAndDelete({_id: request.params.id})
    .then(result => {
        response.status(200).json({
            message: "book deleted"
        });
    })
    .catch(error => {
        response.status(404).json({
            error: "book not found"
        });
    });
});

module.exports = booksRouter;