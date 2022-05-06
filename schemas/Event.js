var mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        trim:true,
        required: true
    },
    type: {
        type: String,
        trim:true,
        required: true
    },
    place: {
        type: String,
        trim:true,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
    registeredUsers: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            status: {
                type: mongoose.Schema.Types.Boolean,
                default: false
            },
            QRImage: {
                type: String,
            }
        }
    ]
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
