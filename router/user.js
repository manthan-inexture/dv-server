const express = require('express');
const router = new express.Router();
const bcrypt = new require('bcryptjs');
const User = require('../schemas/User');
const Event = require('../schemas/Event');
const auth = require('../middleware/user/auth');
const checkRegister = require('../middleware/user/checkRegister');

const { sendWelcomeMail, sendEventRegistrationMail } = require('../mailer.js')
const generateQR = require('../assets/generateQR');

// create user
router.post('/user/register', async (req, res) => {
    const { firstname, lastname, email, password } = req.body;
    if (!firstname || !lastname || !email || !password) {
        return res.status(422).json({ error: "Plz fill the data properly" });
    }
    try {
        const userExist = await User.findOne({ email: email });
        if (userExist) {
            return res.status(422).json({ error: "Email already Exist" });
        }
        const user = new User({ firstname, lastname, email, password });
        const result = await user.save();
        sendWelcomeMail(user.email, user.firstname);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

router.post('/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Enter valid email or password' });
        }

        const user = await User.findOne({ email: email });
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password)
            if (isMatch) {
                const token = await user.makeAuthToken();
                res.cookie("userLoginToken", token, {
                    expires: new Date(Date.now() + 2589200000),
                    httpOnly: true
                });
                res.json(user);
            } else {
                res.status(400).json({ error: 'Wrong Password' });
            }
        } else {
            res.status(400).json({ error: "user not available" })
        }
    } catch (error) {
        console.log(error);
    }
});

router.patch('/user/update', auth, async (req, res) => {
    const { firstname, lastname, email, oldPassword, newPassword } = req.body;
    try {
        if (!firstname || !lastname || !email || !oldPassword) {
            return res.status(400).json({ error: 'enter the details properly' });
        }
        const databasePassword = req.user.password
        const isMatch = await bcrypt.compare(oldPassword, databasePassword);
        if (isMatch) {
            const user = await User.findById(req.userID);
            if (!newPassword) {
                if (!user) {
                    return res.status(404).json({ error: 'user not found' });
                } else {
                    user.firstname = firstname;
                    user.lastname = lastname;
                    user.email = email;
                    await user.save()
                    res.json(user)
                }
            } else {
                user.firstname = firstname;
                user.lastname = lastname;
                user.email = email;
                user.password = newPassword;
                await user.save();
                res.json(user);
            }
        } else {
            res.status(400).json({ error: "Please Enter Correct Password for Updating your Profile!" })
        }

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/user/auth', auth, async (req, res) => {
    res.send({ isLoggedIn: true });
});

router.get('/user/profile', auth, async (req, res) => {
    res.send(req.user);
});

// event check registered or not
router.get('/user/event/:id/validate', auth, checkRegister, (req, res) => {
    res.send({ registered: req.registered, event: req.event })
})

// event registration route
router.post('/user/event/:id/register', auth, checkRegister, async (req, res) => {
    if (req.registered) {
        return res.status(400).json({ error: 'user is already registered' });
    }
    try {
        const event = await Event.findById(req.event._id);
        if (!event) {
            throw new Error('Event not found');
        }
        const user = await User.findById(req.userID);
        const dataURL = await generateQR(`/customer/event/${event._id}/${user._id}`);
        sendEventRegistrationMail(`${user.firstname} ${user.lastname}`,user.email,event.name,dataURL);
        event.registeredUsers.push({ user: user._id, QRImage: dataURL });
        user.registeredEvents.push(event._id);
        await event.save();
        await user.save();
        res.send({ status: "user registered." });
    } catch (e) {
        console.log(e.message);
        res.status(400).send({ error: e.message });
    }
});

// event deregister route
router.post('/user/event/:id/deregister', auth, checkRegister, async (req, res) => {
    if (!req.registered) {
        return res.status(400).json({ error: 'user is not registered' });
    }
    try {
        const registeredEvent = await Event.findById(req.params.id);
        const user = await User.findById(req.userID);
        user.registeredEvents = user.registeredEvents.filter((event) => {
            return !(event.equals(registeredEvent._id));
        });
        registeredEvent.registeredUsers = registeredEvent.registeredUsers.filter((userData) => {
            return !(userData.user.equals(user._id));
        });
        await registeredEvent.save();
        await user.save();
        res.status(200).json({ status: "user deregistered." });
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});

router.get('/user/event/read', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userID).populate("registeredEvents", 'name type place startDate endDate');
        res.send(user);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});

router.get('/user/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((t) => {
            return t.token !== req.token
        })
        await req.user.save();
        res.clearCookie('userLoginToken');
        res.status(200).send('User logged out');
    } catch (e) {
        res.status(400).send(e)
    }
});

router.get('/user/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []

        await req.user.save();
        res.clearCookie('userLoginToken');
        res.status(200).send("User Logout from all Devices!")
    } catch (e) {
        res.status(400).send(e)
    }
});


module.exports = router
