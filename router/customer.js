const express = require('express');
const router = new express.Router();
const bcrypt = new require('bcryptjs');
const Customer = require('../schemas/Customer');
const Event = require('../schemas/Event');
const User = require('../schemas/User');
const auth = require('../middleware/customer/auth');

const { sendWelcomeMail, sendEventRegistrationMail } = require('../mailer.js')
const checkId = require('../assets/checkId');

// create user
router.post('/customer/register', async (req, res) => {
    const { firstname, lastname, email, password } = req.body;
    if (!firstname || !lastname || !email || !password) {
        return res.status(422).json({ error: "Plz fill the data properly" });
    }
    try {
        const userExist = await Customer.findOne({ email: email });
        if (userExist) {
            return res.status(422).json({ error: "Email already Exist" });
        }
        const customer = new Customer({ firstname, lastname, email, password });
        const result = await customer.save();
        sendWelcomeMail(customer.email, customer.firstname);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

router.post('/customer/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Enter valid email or password' });
        }
        const user = await Customer.findOne({ email: email });
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password)
            if (isMatch) {
                const token = await user.makeAuthToken();
                res.cookie("cusLoginToken", token, {
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
    } catch (e) {
        console.log(e.message);
    }
});

router.patch('/customer/update', auth, async (req, res) => {
    const { firstname, lastname, email, oldPassword, newPassword } = req.body;
    try {
        if (!firstname || !lastname || !email || !oldPassword) {
            return res.status(400).json({ error: 'enter the details properly' });
        }
        const databasePassword = req.rootUser.password
        const isMatch = await bcrypt.compare(oldPassword, databasePassword);
        if (isMatch) {
            const customer = await Customer.findById(req.userID);
            if (!newPassword) {
                if (!customer) {
                    return res.status(404).json({ error: 'user not found' });
                } else {
                    customer.firstname = firstname;
                    customer.lastname = lastname;
                    customer.email = email;
                    await customer.save()
                    res.json(customer)
                }
            } else {
                customer.firstname = firstname;
                customer.lastname = lastname;
                customer.email = email;
                customer.password = newPassword;
                await customer.save();
                res.json(customer);
            }
        } else {
            res.status(400).json({ error: "Please Enter Correct Password for Updating your Profile!" })
        }

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/customer/auth', auth, async (req, res) => {
    res.send({ isLoggedIn: true });
});

router.get('/customer/profile', auth, async (req, res) => {
    res.send(req.rootUser);
});

// Event routes for customer

router.post('/customer/event/create', auth, async (req, res) => {
    const { name, type, place, startDate, endDate } = req.body;
    if (!name || !type || !place || !startDate || !endDate) {
        return res.status(400).json({ error: 'enter the details properly' });
    }
    try {
        const event = new Event({ name, type, place, startDate, endDate });
        await event.save();
        const customer = await Customer.findById(req.userID);
        customer.createdEvents.push(event);
        await customer.save();
        res.status(201).send(customer);
    } catch (e) {
        res.status(400).send(e.message);
    }
})

router.get('/customer/event/read', auth, async (req, res) => {
    try {
        const customer = await Customer.findById(req.userID).populate("createdEvents", "name type place startDate endDate");
        res.send(customer);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});

router.get('/customer/event/:id/read', auth, async (req, res) => {
    try {
        if (!checkId(req.params.id)) {
            throw new Error('URL Invalid');
        }
        const event = await Event.findById(req.params.id).populate("registeredUsers.user", 'firstname lastname email');
        res.send(event);
    } catch (e) {
        console.log(e.message);
        res.status(400).send({ error: e.message });
    }
});

router.put('/customer/event/:id', auth, async (req, res) => {
    const { name, type, place, startDate, endDate } = req.body;
    if (!name || !type || !place || !startDate || !endDate) {
        return res.status(400).json({ error: 'enter the details properly' });
    }
    try {
        if (!checkId(req.params.id)) {
            throw new Error('URL Invalid');
        }
        const event = await Event.findByIdAndUpdate(req.params.id, { name, type, place, startDate, endDate }, { new: true });
        res.send(event);
    } catch (e) {
        console.log(e.message);
        res.status(400).send({ error: 'Event Update Failed' });
    }
});

router.delete('/customer/event/:id', auth, async (req, res) => {
    try {
        if (!checkId(req.params.id)) {
            throw new Error('URL Invalid');
        }
        const deletedEvent = await Event.findByIdAndDelete(req.params.id);
        const customer = await Customer.findById(req.userID);
        customer.createdEvents = customer.createdEvents.filter((event) => {
            return !(event.equals(deletedEvent._id))
        });
        await customer.save();
        deletedEvent.registeredUsers.forEach(async (userData) => {
            const user = await User.findById(userData.user);
            user.registeredEvents = user.registeredEvents.filter((event) => {
                return !(event.equals(deletedEvent._id));
            });
            await user.save();
        });
        res.send(deletedEvent);
    } catch (e) {
        console.log(e);
        res.status(400).send({ error: 'Event Delete Failed.' });
    }
});

router.get('/events', async (req, res) => {
    try {
        const events = await Event.aggregate([{ $project: { registeredUsers: 1 } }]);
        res.send(events);
    } catch (e) {
        console.log(e);
        res.status(400).send(e.message);
    }
});

router.get('/customer/event/:event_id/:user_id/read', async (req, res) => {
    try {
        if (!checkId(req.params.event_id) || !checkId(req.params.user_id)) {
            throw new Error('URL Invalid');
        }
        const event = await Event.findById(req.params.event_id);
        if (!event) {
            throw new Error('Event not found');
        }
        const user = await User.findById(req.params.user_id).select('firstname lastname email');
        if (!user) {
            throw new Error('User not found');
        }
        const registeredUser = event.registeredUsers.find((userData) => {
            return userData.user.equals(user.id);
        })
        if (!registeredUser) {
            throw new Error('User is not registered for this event')
        }
        const { _id, name, type, place, startDate, endDate } = event;
        res.status(200).send({ event: { _id: _id, name, type, place, startDate, endDate }, user: user, status: registeredUser.status });
    } catch (e) {
        console.log(e.message);
        res.status(400).send({ error: e.message });
    }
});

router.get('/customer/event/:event_id/:user_id/status', async (req, res) => {
    try {
        if (!checkId(req.params.event_id) || !checkId(req.params.user_id)) {
            throw new Error('URL Invalid');
        }
        const event = await Event.findById(req.params.event_id);
        if (!event) {
            throw new Error('Event not found');
        }
        const user = await User.findById(req.params.user_id);
        if (!user) {
            throw new Error('User not found');
        }
        event.registeredUsers.forEach((userData, index) => {
            if (userData.user.equals(user._id)) {
                if (userData.status === true) {
                    throw new Error('You are already Checked In');
                } else {
                    event.registeredUsers[index].status = true;
                }
            }
        });
        await event.save();
        res.status(200).send({ message: "Status Update Successful." });
    } catch (e) {
        console.log(e.message);
        res.status(400).send({ error: e.message });
    }
});

router.get('/customer/logout', auth, async (req, res) => {
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((t) => {
            return t.token !== req.token
        })

        await req.rootUser.save();
        res.clearCookie('cusLoginToken');
        res.status(200).send('User logged out');
    } catch (e) {
        res.status(400).send(e.message)
    }
});

router.get('/customer/logoutAll', auth, async (req, res) => {
    try {
        req.rootUser.tokens = []

        await req.rootUser.save();
        res.clearCookie('cusLoginToken');
        res.status(200).send("User Logout from all Devices!")
    } catch (e) {
        res.status(400).send(e.message)
    }
});


module.exports = router
