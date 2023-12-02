const mongoose = require('mongoose');

const booksSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    title:String,
    author:String,
    summary:String
});

module.exports = mongoose.model('Book', booksSchema);