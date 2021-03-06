const Posts = require('../models/post.model')
const mongoose = require('mongoose');
const formidable = require('formidable');
const fs = require('fs')
const mongodb = require('mongodb')


const getPosts = (req, res, next) => {
    Posts.find({})
        .populate('user', 'name _id')
        .populate('reactList.user', 'name _id')
        .populate('comments.user', 'name _id')
        .sort("-createdAt")
        .then((posts) => {
            let newPosts = JSON.parse(JSON.stringify(posts));
            newPosts = newPosts.map(post => {
                post.images = post.images.map(img => {
                    return {
                        _id: img._id,
                        url: `http://${process.env.HOST}:${process.env.PORT}/${post.user._id}/post/${post._id}/photos/${img._id}`
                    };
                });
                post.videos = post.videos.map(vidId => {
                    return {
                        _id: vidId,
                        url: `http://${process.env.HOST}:${process.env.PORT}/${post.user._id}/videos/${vidId}`
                    };
                });
                return post;
            })
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(newPosts);

        }).catch(err => {
            next(err);
        })
}


const getVideo = (req, res, next) => {
    let { userId, videoId } = req.params
    mongodb.MongoClient.connect(process.env.MONGO_URI, function (error, client) {
        if (error) {
            res.status(500).json(error);
            return;
        }

        const range = req.headers.range;
        if (!range) {
            return res.status(400).send("Requires Range header");
        }

        const db = client.db('myFirstDatabase');
        // GridFS Collection
        db.collection('uploads.videos.files').findOne({ _id: mongoose.Types.ObjectId(videoId) }, (err, video) => {
            if (err) {
                console.log(err);
                return next(err);
            }
            if (!video) {
                res.status(404).send("No video uploaded!");
                return;
            }

            // Create response headers
            const videoSize = video.length;
            const start = Number(range.replace(/\D/g, ""));
            const end = videoSize - 1;

            const contentLength = end - start + 1;
            const headers = {
                "Content-Range": `bytes ${start}-${end}/${videoSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": contentLength,
                "Content-Type": "video/mp4",
            };

            // HTTP Status 206 for Partial Content
            res.writeHead(206, headers);

            const bucket = new mongodb.GridFSBucket(db, {
                bucketName: 'uploads.videos'
            });
            const downloadStream = bucket.openDownloadStream(mongoose.Types.ObjectId(videoId), {
                start, end: videoSize
            });

            // Finally pipe video to response
            downloadStream.pipe(res).on('finish', function () {
                console.log('done!')
            });
        });
    });
}

const getImage = (req, res, next) => {
    let { userId, postId, imageId } = req.params;
    Posts.findById(postId)
        .then(post => {
            if (!post) {
                err = new Error('Could not find this post');
                err.status = 403;
                return next(err);
            }
            let image = post.images.find(img => img._id == imageId);
            if (!image) {
                err = new Error('Could not find this image');
                err.status = 403;
                return next(err);
            }
            res.statusCode = 200;
            res.end(image.data);
        })
        .catch(error => {
            return next(error);
        })
}

const addPost = async (req, res, next) => {
    const form = formidable.IncomingForm()
    form.keepExtensions = true
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.log(err);
            return next(err);
        }
        let videoId = null, images = [];
        let { article, userId } = fields;
        mongodb.MongoClient.connect(process.env.MONGO_URI, async function (error, client) {
            if (error) {
                return next(error);
            }
            if (files['videos-post']) {
                const db = client.db('myFirstDatabase');
                const bucket = new mongodb.GridFSBucket(db, {
                    bucketName: 'uploads.videos'
                });
                const videoUploadStream = bucket.openUploadStream(files['videos-post'].name);
                videoId = videoUploadStream.id
                const videoReadStream = fs.createReadStream(files['videos-post'].path);
                videoReadStream.pipe(videoUploadStream);
            }
            // console.log(files);
            if (files['image-post-0']) {
                for (let key in files) {
                    let image = {};
                    image.data = fs.readFileSync(files[key].path);
                    image.contentType = files[key].type;
                    images.push(image);
                }
            }
            if (article || images.length || videoId) {
                try {
                    const post = await Posts.create({ article, user: userId })
                    Posts.findById(post._id)
                        .populate('user', 'name _id')
                        .then(async (post) => {
                            if (images.length) {
                                post.images.push(...images);
                            }
                            if (videoId) {
                                post.videos.push(videoId);
                            }
                            await post.save();
                            let newPost = JSON.parse(JSON.stringify(post));
                            newPost.images = newPost.images.map(img => {
                                return {
                                    _id: img._id,
                                    url: `http://${process.env.HOST}:${process.env.PORT}/${post.user._id}/post/${post._id}/photos/${img._id}`
                                };
                            });
                            newPost.videos = newPost.videos.map(vidId => {
                                return {
                                    _id: vidId,
                                    url: `http://${process.env.HOST}:${process.env.PORT}/${post.user._id}/videos/${vidId}`
                                };
                            });
                            res.statusCode = 201;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(newPost);
                        })
                } catch (error) {
                    return next(error);
                }
            } else {
                res.statusCode = 403;
                res.end('Could not post!');
            }
        });
    })
}

const deletePost = (req, res, next) => {
    Posts.findById(req.params.postId)
        .then(post => {
            if (!post) {
                err = new Error('Could not find this post');
                err.status = 403;
                return next(err);
            }
            if (post.user == req.params.userId) {
                Posts.findByIdAndRemove(req.params.postId)
                    .then((resp) => {
                        // console.log(resp);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(resp);
                    }, (err) => next(err))
                    .catch((err) => next(err));
            } else {
                err = new Error('You are not authorized to delete this comment');
                err.status = 403;
                return next(err);
            }
        }).catch(err => next(err))

}

const reactPost = async (req, res, next) => {
    let reactType = req.body.reactType;
    let userId = req.body.userId;
    try {
        let post = await Posts.findById(req.body.postId);
        if (!post) {
            err = new Error('Could not find this post');
            err.status = 403;
            return next(err);
        }
        let react = post.reactList.find(r => r.user == userId);
        if (!react) {
            post.reactList.push({ user: userId, reactType });
            await post.save();
        } else {
            if (!post.reactList.id(react._id)) {
                let err = new Error('Could not find this react');
                err.status = 403;
                return next(err);
            }
            if (reactType == react.reactType) {
                post.reactList.id(react._id).remove();
                await post.save();
            } else {
                post.reactList.id(react._id).reactType = reactType;
                await post.save();
            }
        }
        Posts.findById(post._id)
            .populate('reactList.user', '_id name')
            .populate('comments.user', '_id name')
            .then(post => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(post);
            })
    } catch (error) {
        return next(error);
    }

}

const addCommentPost = async (req, res, next) => {
    try {
        console.log(req.body)
        const post = await Posts.findById(req.body.postId);
        if (!post) {
            let err = new Error('Could not find this post');
            err.status = 403;
            return next(err);
        }
        post.comments.unshift({ comment: req.body.comment, user: req.body.userId });
        await post.save();
        Posts.findById(post._id)
            .populate('reactList.user', '_id name')
            .populate('comments.user', '_id name')
            .then(post => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(post);
            })
    } catch (error) {
        return next(error);
    }
}

const deleteComment = async (req, res, next) => {
    try {
        const post = await Posts.findById(req.params.postId);
        if (!post) {
            let err = new Error('Could not find this post');
            err.status = 403;
            return next(err);
        }
        if (!post.comments.id(req.params.commentId)) {
            let err = new Error('Could not find this commnent');
            err.status = 403;
            return next(err);
        }
        post.comments.id(req.params.commentId).remove();
        await post.save();
        Posts.findById(post._id)
            .populate('reactList.user', '_id name')
            .populate('comments.user', '_id name')
            .then(post => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                // console.log(post);
                res.json(post);
            })


    } catch (err) {
        return next(err)
    }
}




module.exports = {
    getPosts, addPost, deletePost, reactPost, addCommentPost,
    deleteComment, getVideo, getImage
}