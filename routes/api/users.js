const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
// ...rest of the initial code omitted for simplicity.
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const Post = require('../../models/Post');


//@router           POST api/users
//@description      Register user
//@access           Public
router.post(
    '/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'please include a valid Email').isEmail(),
        check('password', 'please enter a password with 6  or more characters').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!(errors.isEmpty())) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, email, password } = req.body;
        try {

            //Check if user is exist
            let user = await User.findOne({ name });
            if (user) {
                return res.status(400).json({ errors: [{ msg: 'User already exist' }] });
            }

            //Get user avatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm '
            });
            user = new User({
                name,
                email,
                avatar,
                password
            });
            //Encrypt password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            //Return jsonwebToken
            const payLoad = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payLoad,
                config.get('jwtSecret'),
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    });


//@router           GET api/users
//@description      Get all users
//@access           Public
router.get(
    '/',
    async (req, res) => {
        try {
            let users = await User.find();
            //Check if there are users in the db
            if (!users) {
                return res.status(400).json({ errors: [{ msg: 'No usere found' }] });
            }
            res.json(users);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

//@router           DELETE api/users
//@description      DELETE user by id
//@access           Public

router.delete(
    '/:id',
    async (req, res) => {
        try {
            let user = await User.findById(req.params.id);

            //Check if there are users in the db
            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'No user found' }] });
            }
            await user.remove();
            res.json({
                deleted: true,
                user: user
                // posts: posts
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    });


//@router           GET api/users
//@description      Get user by id
//@access           Public
router.get(
    '/:id',
    async (req, res) => {
        try {
            let user = await User.findById(req.params.id);
            //Check if there are users in the db
            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'No user found' }] });
            }
            res.json(user);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);
module.exports = router;










