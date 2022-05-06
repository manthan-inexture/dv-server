const Event = require("../../schemas/Event");
const checkId = require("../../assets/checkId");

const checkRegister = async (req, res, next) => {
    try {
        let registered = false;
        if (!checkId(req.params.id)) {
            throw new Error("URL Invalid")
        }
        const event = await Event.findById(req.params.id);
        if (!event) {
            throw new Error('Event not found');
        }
        event.registeredUsers.forEach((userData) => {
            if (userData.user.equals(req.userID)) {
                registered = true;
            }
        });
        req.registered = registered;
        req.event = event;
        next();
    } catch (e) {
        console.log(e.message);
        res.status(400).send({ error: e.message });
    }
}

module.exports = checkRegister