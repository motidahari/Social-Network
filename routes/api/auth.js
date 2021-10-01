const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');

// ...rest of the initial code omitted for simplicity.
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');

//@router           GET api/auth
//@description      Test auth
//@access           Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-passwors");
        res.json(user);
    } catch (err) {
        console.error(err.massege);
        res.status(500).send('Server Error');
    }
});



//@router           POST api/auth
//@description      Authentication user
//@access           Public
router.post(
    '/',

    [
        check('email', 'Please include a valid Email').isEmail(),
        check('password', 'Password is required').exists()
    ],

    async (req, res) => {
        const errors = validationResult(req);
        if (!(errors.isEmpty())) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        try {
            //Check if user is exist
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const payLoad = {
                user: {
                    id: user.id
                }
            };

            const passwordFromDB = user.password;
            const isMatch = await bcrypt.compare(password, passwordFromDB);
            if (!isMatch) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

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

module.exports = router;