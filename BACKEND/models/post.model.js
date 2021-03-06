const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    comment: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Types.ObjectId,
        require: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

const reactSchema = new Schema({
    reactType: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Types.ObjectId,
        require: true,
        ref: 'User'
    }
}, {
    timestamps: true,
})


const postSchema = new Schema({
    article: {
        type: String,
        require: true
    },
    user: {
        type: mongoose.Types.ObjectId,
        require: true,
        ref: 'User'
    },
    images: [{
        data: Buffer,
        contentType: String,
    }],
    videos: [{
        type: mongoose.Types.ObjectId
    }],
    reactList: [reactSchema],
    comments: [commentSchema]
}, {
    timestamps: true
})

const Posts = mongoose.model('Post', postSchema);

module.exports = Posts