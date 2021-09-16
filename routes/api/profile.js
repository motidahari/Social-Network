const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');


//@router           GET api/profile/me
//@description      Get current user profile
//@access           Private
router.get(
    '/me',
    auth,
    async (req, res) => {
        try {
            const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['user', 'avatar']);
            if (!profile) {
                return res.status(400).json({ msg: 'There are no profile for this user' });
            }
        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);



//@router           POST api/profile
//@description      Create or Update user profile
//@access           Private
router.post(
    '/',
    [
        auth,
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            twitter,
            facebook,
            linkedin,
            instegram
        } = req.body;

        //Build profileFields Object
        const profileFields = {};
        profileFields.user = req.user.id;

        if (company) { profileFields.company = company }
        if (website) { profileFields.website = website }
        if (location) { profileFields.location = location }
        if (bio) { profileFields.bio = bio }
        if (status) { profileFields.status = status }
        if (githubusername) { profileFields.githubusername = githubusername }
        if (skills) {
            profileFields.skills = skills.split(',').map((skill) => skill.trim());
        }

        console.log(profileFields.skills);

        //Build social Object
        profileFields.social = {};
        if (youtube) { profileFields.social.youtube = youtube }
        if (facebook) { profileFields.social.facebook = facebook }
        if (linkedin) { profileFields.social.linkedin = linkedin }
        if (instegram) { profileFields.social.instegram = instegram }

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                //Update
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                );
                console.log('Updated');
                return res.json(profile);
            }
            //Create
            profile = new Profile(profileFields);
            await profile.save();
            console.log('Created');
            res.json(profile);
        } catch (err) {
            console.error(err.massege);
            res.status(500);
            res.send('Server Error');
        }
    }
);



//@router           GET api/profile
//@description      Get all profiles
//@access           Public
router.get(
    '/',
    async (req, res) => {
        try {
            const profiles = await Profile.find().populate('user', ['name', 'avatar']);
            res.json(profiles);
        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);

//@router           GET api/profile/user/:user_id
//@description      Get all profiles by user_id
//@access           Public
router.get(
    '/user/:user_id',
    async (req, res) => {
        try {
            const profile = await Profile.findOne({
                user: req.params.user_id
            }).populate('user', ['name', 'avatar']);
            if (!profile) {
                return res.status(400).json({ msg: 'Profile not found' });
            }
            res.json(profile);
        } catch (err) {
            console.error(err.massege);
            if (err.kind == 'ObjectId') {
                return res.status(400).json({ msg: 'Profile not found' });
            }
            res.status(500).send('Server Error');
        }
    }
);

//@router           DELETE api/profile
//@description      Delete profile, user & posts 
//@access           Public

router.delete(
    '/',
    auth,
    async (req, res) => {
        try {
            //@todo - remove users posts
            // console.log(req.user.id);
            //Remove profile
            await Profile.findOneAndDelete({ user: req.user.id });
            //Remove user
            await User.findOneAndDelete({ _id: req.user.id });

            res.json({ msg: 'user deleted' });
        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);


//@router           PUT api/profile/experience
//@description      Add profile experience
//@access           Private

router.put(
    '/experience',
    [
        auth,
        check('title', 'Title is required').not().isEmpty(),
        check('company', 'Company is required').not().isEmpty(),
        check('from', 'From is required').not().isEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;

        const newExperience = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            if (!profile) {
                return res.status(400).json({ msg: 'Profile is not founded' });
            }
            profile.experience.unshift(newExperience);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);



//@router           DELETE api/profile/experience/:exp_id
//@description      Delete profile experience from profile
//@access           Private
router.delete(
    '/experience/:exp_id',
    auth,
    async (req, res) => {

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            //Get remove index
            const removeIndex = profile.experience
                .map((item) => { item.id })
                .indexOf(req.params.exp_id);

            profile.experience.splice(removeIndex, 1);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);




//@router           PUT api/profile/education
//@description      Add profile education
//@access           Private
router.put(
    '/education',
    [
        auth,
        check('school', 'School is required').not().isEmpty(),
        check('degree', 'Degree is required').not().isEmpty(),
        check('fieldofstudy', 'Field of study is required').not().isEmpty(),
        check('from', 'From is required').not().isEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;

        const newEducation = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            if (!profile) {
                return res.status(400).json({ msg: 'Profile is not founded' });
            }
            profile.education.unshift(newEducation);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    });



//@router           DELETE api/profile/experience/:exp_id
//@description      Delete profile experience from profile
//@access           Private
router.delete(
    '/education/:edu_id',
    auth,
    async (req, res) => {

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            //Get remove index
            const removeIndex = profile.education
                .map((item) => { item.id })
                .indexOf(req.params.edu_id);

            profile.education.splice(removeIndex, 1);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);


//@router           GET api/profile/github/:username
//@description      Get user from Github
//@access           Public
router.get(
    '/github/:username',
    (req, res) => {
        try {
            const userName = req.params.username;
            const githubClinetId = config.get('githubClinetId');
            const githubSecret = config.get('githubSecret');
            const options = {
                uri: `https://api.github.com/users/${userName}/repos?per_page=5&sort=created:asc&client_id=${githubClinetId}& github_secret=${githubSecret}`,
                method: 'GET',
                headers: { 'user-agent': 'node.js' },
            };
            console.log("uri = " + options.uri);
            request(options, (error, response, body) => {
                // console.log('error:', error); // Print the error if one occurred
                // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                // console.log('body:', body); // Print the HTML for the Google homepage.
                if (error) { console.error(error) }
                if (!response || response.statusCode !== 200) {
                    return res.status(404).json({ msg: 'No Github profile found' });
                }
                res.json(JSON.parse(body));
            })

        } catch (err) {
            console.error(err.massege);
            res.status(500).send('Server Error');
        }
    }
);
module.exports = router;
