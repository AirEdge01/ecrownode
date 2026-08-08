const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const saltRounds = 10;
const User = require('../models/use.models');
// const { json } = require('express');
const  jsonWebToken =require ('jsonwebtoken')

const getSignup = (req, res) => {
    res.render('signup', { title: 'Sign Up' });
}

const postSignup = (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    User.findOne({ email })
            .then((existingUser) => {
            if (existingUser) {
                res.status(400).send('Email already exists');
                return Promise.reject('user already exists');
            }

            // ✅ Ensure password is a valid string before hashing
            const saltRounds = 10;
            return bcrypt.hash(String(password), saltRounds);
        })
        .then((hashedPassword) => {
            if (!hashedPassword) return;
            const newUser = new User({
                firstName,
                lastName,
                email,
                password: hashedPassword,
            });
            return newUser.save();
        })
        .then((savedUser) => {
            if (!savedUser) return;
            console.log('User registered successfully');

            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'israeloye2019@gmail.com',
                    pass: 'zuegcnabukvzyziz'
                }
            });

            let mailOptions = {
                from: 'israeloye2019@gmail.com',
                to: req.body.email,
                subject: 'Welcome to our Application',
                html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h1 style="color: #4CAF50;">Welcome to AirEdge Mobile BankApp!</h1>
                    <p>Hi <strong>${firstName} ${lastName}</strong>,</p>
                    <p>Thank you for signing up for our application. We are thrilled to have you on board!</p>
                    <p>Here are some quick links to get you started:</p>
        
                    <p>If you have any questions, feel free to reply to this email. We're here to help!</p>
                    <p>Best regards,</p>
                    <p>The Light Tracker Team</p>
                    <footer style="margin-top: 20px; font-size: 12px; color: #777;">
                        <p>You are receiving this email because you signed up for Light Tracker.</p>
                        <p>&copy; 2025 Light Tracker. All rights reserved.</p>
                    </footer>
                </div>
                `
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent:' + info.response);
                }
            });

            res.status(201).json('user successful')
        })
        .catch((err) => {
            if (err !== 'user already exists') {
                console.log('Error saving user:', err);
                res.status(500).send('Internal server error');
            }
        });
}

const getSigningin = (req, res) => {
    res.render('signin', { title: 'Sign In' });
   
}

const postSigningin= async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('Invalid email or password');
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).send('Invalid email or password');
        }

        const token = jsonWebToken.sign({id:user.id, email:user.email}, process.env.jsonSecretKey, {expiresIn: '1h'})
        // console.log(token);
        res.status(200 || 200).json({success:true, message: 'user logged in', token})
        
        res.status(201).json({success: true, message:'successful'})
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send('Internal server error');  
    }
}

module.exports={postSignup,getSignup,postSigningin ,getSigningin}
