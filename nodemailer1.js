
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transpoter=nodemailer.createTransport(
    {
        secure:true,
        host:'smtp.gmail.com',
        port:465,
        auth:{
            user: process.env.EMAIL_USER,    // from .env
    pass: process.env.EMAIL_PASSWORD,
        }
    }
);

function sendMail(to,sub,msg){
        transpoter.sendMail({
            to:to,
            subject:sub,
            html:msg
        })
        console.log("email Sent");
        
}

sendMail("sravs4334@gmail.com","hiredUp","Your aplied to job ")