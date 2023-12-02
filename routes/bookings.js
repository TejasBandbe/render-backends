const express = require('express');
const { constants, mail } = require('../env');
const db = require('../db');
const nodemailer = require('nodemailer');
const bookingsRouter = express.Router();

function executeQuery(statement){
    return new Promise((resolve, reject) =>{
        db.query(statement, (error, data) =>{
            if (error) {
                reject(error);
            } 
            else {
                resolve(data);
            }
        });
    });
};

//api to get names of doctors
bookingsRouter.get('/getdoctors', async(request, response) => {
    try{
        const statement = `select id, drname from doctors`;
        const data = await executeQuery(statement);
        if(data.length === 0){
            response.status(404).send({"message": "no data"});
        }
        else{
            response.send(data);
        }
    }catch(error){
        response.status(400).send(error);
    }
});

//api to get timeslots for selected doctor
bookingsRouter.post('/gettimes', async(request, response) => {
    try{
        const statement = `select time_format(timeslot, '%H:%i') as timeslot,
        time_format(timeslot, '%h:%i %p') as value from times 
        where drid = ${request.body.drid} and time(timeslot) > date_add(curtime(), interval 5 hour)`;
        const data = await executeQuery(statement);
        if(data.length === 0){
            response.send(data);
            // response.status(404).send({"error": "slot not available"});
        }else{
            response.status(200).send(data);
        }
    }catch(error){
        response.status(400).send(error);
    }
});

//api to book appointment
bookingsRouter.post('/book', async(request, response) => {
    try{
        const statement = `insert into bookings(name, age, gender, address, mob_no, email_id, drid, appointment_date, 
            appointment_time) select '${request.body.name}', ${request.body.age}, 
            '${request.body.gender}', '${request.body.address}', '${request.body.mob_no}', 
            '${request.body.email_id}', ${request.body.drid}, curdate(), 
            concat('2001-01-01 ','${request.body.appointment_time}') from dual 
            where not exists (select 1 from bookings where email_id = '${request.body.email_id}'
            and appointment_date = curdate() and drid = ${request.body.drid})`;

        const data = await executeQuery(statement);
        if(data.affectedRows === 1){
            response.status(201).send({"message": "appointment booked", data});
        }else{
            response.status(208).send({"message": "already booked"});
        }
    }catch(error){
        if(error.errno === 1064){
            response.status(400).send({"error": "special characters not allowed"});
        }
        else{
            response.status(400).send(error);
        }
    }
});

//api to delete booked timeslot
bookingsRouter.post('/deleteslot', async(request, response) => {
    try{
        const statement = `delete from times where drid = ${request.body.drid} 
        and time_format(timeslot, '%H:%i') = '${request.body.timeslot}'`;
        const data = await executeQuery(statement);
        if(data.affectedRows === 0){
            response.status(404).send({"error": "wrong slot"});
        }else{
            response.status(200).send({"message": "slot deleted"});
        }
    }catch(error){
        response.status(400).send(error);
    }
});

//api to get data
bookingsRouter.post('/getdata', async(request, response) => {
    try{
        const statement = `select b.id, b.name, b.age, b.gender, b.address, b.mob_no, 
        b.email_id, d.drname, d.clinic, d.draddress, d.drmob,
        concat(
          dayname(b.appointment_date), ',', ' ',
          day(b.appointment_date), 
          case 
            when DAY(b.appointment_date) IN (11,12,13) then 'th' 
            when DAY(b.appointment_date) % 10 = 1 then 'st' 
            when DAY(b.appointment_date) % 10 = 2 then 'nd' 
            when DAY(b.appointment_date) % 10 = 3 then 'rd' 
            else 'th' 
          end,
          ' ', 
          monthname(b.appointment_date), ' ', 
          year(b.appointment_date)
        ) as date,
        time_format(b.appointment_time, '%h:%i %p') as time
        from bookings b, doctors d 
        where b.drid = d.id and b.id = ${request.body.id}`;

        const data = await executeQuery(statement);
        if(data.length === 0){
            response.status(404).send({"error": "appointment not found"});
        }
        else{
            response.send(data[0]);
        }
    }catch(error){
        if(error.errno === 1064){
            response.status(400).send({"error": "sql syntax error"});
        }
        else{
            response.status(400).send(error);
        }
    }
});

//api to send email
bookingsRouter.post('/sendmail', async(request, response) =>{
    try{
    const mailid = request.body.email_id;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: mail.EMAIL_ID,
            pass: mail.PASSKEY
        }
    });

    const message = `
Dear ${request.body.name},

We are pleased to confirm that your appointment with ${request.body.drname} has been scheduled successfully. Details of the appointment are as follows:

- Date: ${request.body.date}
- Time: ${request.body.time}
- Clinic: ${request.body.clinic}, ${request.body.draddress}

If you have any questions or need to reschedule, please contact our office at ${constants.PHONE_NO} as soon as possible.

We look forward to providing you with excellent healthcare services. Thank you for choosing MedBookingPro.

Best regards,

MedBookingPro team
+91 9823629901             
`

    const mailOptions = {
        from: mail.EMAIL_ID,
        to: mailid,
        subject: mail.SUBJECT,
        text: message,
    };

    transporter.sendMail(mailOptions, (error, info) =>{
        if(error){
            response.status(500).send({error:'Internal Server Error'});
        }else{
            response.status(200).send({success:true});
        }
    });
    }catch(error){
        response.status(400).send(error);
    }
});

//api to get data from email id
bookingsRouter.post('/download', async(request, response) =>{
    try{
        const statement = `select id from bookings where email_id = '${request.body.email_id}' 
        and appointment_date = curdate() and drid = ${request.body.drid}`;

        const data = await executeQuery(statement);
        if(data.length === 0){
            response.status(404).send({"error": "appointment not found"});
        }
        else{
            response.send(data[0]);
        }
    }catch(error){
        if(error.errno === 1064){
            response.status(400).send({"error": "sql syntax error"});
        }
        else{
            response.status(400).send(error);
        }
    }
});

module.exports = bookingsRouter;