const jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    firstname : {
        type: String,
        trim:true,
        required: true
    },
    lastname : {
        type: String,
        trim:true,
        required: true
    },
    email : { 
       type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
        validate(value) {
            if(!validator.isEmail(value)){
                throw new Error("Email is not valid!")
            }
        }
    },
    password : {
        type : String,
        required : true,
        minlength : 7,
        max : 12,           
        trim : true,
        validate(value) {
            if(value.toLowerCase().includes('password')){
                throw new Error("Password can't contain 'password' word")
            }
        }
    },
    tokens : [
        {
            token: {
                type: String,
                required: true
            }
        }
    ],
    registeredEvents : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event'
        }
    ]
},{
    timestamps : true
});

userSchema.pre('save', async function(next){
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});
// Method for hinding private data of user
userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

userSchema.methods.makeAuthToken = async function() {
    try {
        let token = jwt.sign({_id:this._id}, "KALPKALPKALPKALPKALPKALPKALPKALP")
        this.tokens = this.tokens.concat({ token:token });
        await this.save();
        return token;
    } catch (err) {
        console.log(err);
    }
}

const User = mongoose.model('User',userSchema);
module.exports = User;
