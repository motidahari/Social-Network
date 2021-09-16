const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');

const Profile = require('../../models/Profile');
const Post = require('../../models/Post');
const User = require('../../models/User');

//@router           POST api/posts
//@description      Create a post
//@access           Private
router.post(
    '/',
    [
        auth,
        [
            check('text', 'Test is required')
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const user = await User.findById(req.user.id).select('-password');

            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            });
            const post = await newPost.save();
            res.json(post);

        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);



//@router           GET api/posts
//@description      Get all posts
//@access           Private
router.get(
    '/',
    auth,
    async (req, res) => {
        try {
            const posts = await Post.find().sort({ date: -1 });
            res.json(posts);

        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);

//@router           GET api/posts
//@description      Get a post by id
//@access           Private
router.get(
    '/:id',
    auth,
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                return res.status(404).json({ msg: 'Post not found' })
            }
            res.json(post);
        } catch (err) {
            console.error(err.massege);
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Post not found' })
            }
            res.status(500).send('Server Error');
        }
    }
);


//@router           DELETE api/posts
//@description      Delete a post by id
//@access           Private
router.delete(
    '/:id',
    auth,
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            //Check post
            if (!post) {
                return res.status(404).json({ msg: 'Post not found' })
            }
            // Check user
            if (post.user.toString() !== req.user.id) {
                return res.status(401).json({ msg: 'User not authorized' })
            }
            // //action
            await post.remove();

            res.json({
                deleted: true,
                post: post
            });
        } catch (err) {
            console.error(err.massege);
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Post not found' })
            }
            res.status(500).send('Server Error');
        }
    }
);

//@router           PUT api/posts/like/:id
//@description      Like a post
//@access           Private
router.put(
    '/like/:id',
    auth,
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            //Check post
            if (!post) {
                return res.status(404).json({ msg: 'Post not found' })
            }
            // Check if the post has already been liked 
            if (post.likes.filter((like) => like.user.toString() === req.user.id).length > 0) {
                return res.status(400).json({ msg: 'Post already liked' })
            }
            post.likes.unshift({ user: req.user.id });
            await post.save();

            res.json(post.likes);
        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);


//@router           PUT api/posts/unlike/:id
//@description      Unlike a post
//@access           Private
router.put(
    '/unlike/:id',
    auth,
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            //Check if post exist
            if (!post) {
                return res.status(404).json({ msg: 'Post not found' })
            }
            // Check if the post has already been liked by user id
            if (post.likes.filter((like) => like.user.toString() === req.user.id).length == 0) {
                return res.status(400).json({ msg: 'Post has not yet been liked' })
            }
            //Get remove index for like
            const removeIndex = post.likes.map((like) => like.user.toString().indexOf(req.user.id));
            post.likes.splice(removeIndex, 1);
            await post.save();
            res.json(post.likes);
        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);

//@router           POST api/posts/comment/:id
//@description      Comment on a post a post
//@access           Private
router.post(
    '/comment/:id',
    [
        auth,
        [
            check('text', 'Text is required')
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const user = await User.findById(req.user.id).select('-password');
            const post = await Post.findById(req.params.id);
            if (!user ) {
                return res.status(400).json({ msg: 'No user found' })
            }
            if (!post) {
                return res.status(400).json({ msg: 'No post found' })
            }
            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            };
            post.comments.unshift(newComment);
            await post.save();
            res.json(post.comments);

        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);


//@router           DELETE api/posts/comment/:id/:comment_id
//@description      Delete comment
//@access           Private
router.delete(
    '/comment/:post_id/:comment_id',
    auth,
    async (req, res) => {
       
        try {
            const post = await Post.findById(req.params.post_id);
            //Make sure post exist
            if (!post) {
                return res.status(400).json({ msg: 'No post found' })
            }
            //Pull out comment
            const comment = post.comments.find((comment) => comment.id === req.params.comment_id);

            //Make sure comment exist
            if (!comment) {
                return res.status(404).json({ msg: 'comment does not exist in this post' });
            }
            const removeIndex = post.comments.map((comment) => comment.user.toString().indexOf(req.user.id));
            post.comments.splice(removeIndex, 1);
            await post.save();
            res.json(post.comments);
            // post.comments
        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);
module.exports = router;