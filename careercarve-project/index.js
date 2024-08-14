import  express, { response }  from "express";
import { student_model } from "./database/tables/student.js";
import { mentor_model } from "./database/tables/mentors.js";
import { schedule_model } from "./database/tables/schedule.js";
import { payment_model } from "./database/tables/payments.js";
import mongoose from "mongoose";
import cors from 'cors';
import  Jwt  from "jsonwebtoken";
import { mentor_avalability_model } from "./database/tables/mentor_avalability.js";

const app=express()
app.use(express.json())
app.use(cors())



const port=process.env.PORT || 5000 

mongoose.connect('mongodb://localhost:27017/careercarve_scheduler', {
   
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

async function check_mail(tbname,email)
{
    console.log(email)
    try
    {
        const user=await tbname.find({"email":email})
        //console.log(user)
        if(user.length>0)
        {
            return false;
        }
        return true
    }
    catch(error)
    {
        return false
    }
}

async function check_user(tbname,body)
{
    try
    {
        const user=await tbname.find(body)
        //console.log(user)
        if(user.length>0)
        {
            return false;
        }
        return true
    }
    catch(error)
    {
        return false
    }
}

async function find_mentors()
{
    return mentor_model.find({},"name interest_area email").select()
}

const authenticateJWT = async(req, res, next) => {
    const token = req.body.token
    console.log(token)

    if (!token) {
        return res.status(200).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = Jwt.verify(token, "career-carve");
        req.user = decoded;
        next()
        }
        catch(error)
        {
            console.log("error",error.message)
        }
};



app.post("/register/student",async(request,response)=>
{

    if(await check_mail(student_model,request.body["email"]))
    {
    try{
        if(request.body.interest_area)
        {
        const  new_student=await student_model.create(request.body)
       
        return await new_student.save()
        .then((res)=> 
        {
            return response.status(201).send("successfull created")
        },
        (error)=> 
        {
            return response.status(200).send("error",error.message)
        })
    }
    else 
    {
        return response.status(200).send("please select interest area")
    }

    }
    catch(error)
    {
        response.status(200).send(error.message)
    }
}
else 
{
    response.status(200).send("user already present")
}

})
app.post("/register/mentor",async(request,response)=>
{
    if(await check_mail(mentor_model,request.body["email"]))
    {
    try{
        const  new_mentor= await mentor_model.create(request.body)
        
        await new_mentor.save()
        .then((res)=> 
        {
            return response.status(201).send("successfull created")
        },
        (error)=> 
        {
            return response.status(500).send("error",error.message)
        })

    }
    catch(error)
    {
        response.status(500).send(error.message)
    }
}
else 
{
    response.send("user already present")
}

})

app.post("/login/student",async(request,response)=>
{
    if(await check_mail(student_model,request.body.email))
    {
        console.log("user not present")
        return response.status(200).send("user not present")
    }
    
   
    if(! await check_user(student_model,request.body))
    {
        const token = Jwt.sign({ email:request.body["email"] }, "career-carve", { expiresIn: '1h' });
        const mentor_data=await find_mentors()
        const meetings=await schedule_model.find({"email":request.body.email},"date start_time end_time")
        return response.status(201).json({ token ,mentor_data,meetings});
    }
    else 
    {
        return response.status(200).send("bed credentilas")
    }

})

app.post("/login/mentor",async(request,response)=>
{
    if(await check_mail(mentor_model,request.body["email"]))
    {
        console.log("user not present")
        return response.status(200).send("user not present")
    }
    
   
    if(! await check_user(mentor_model,request.body))
    {
        const token = Jwt.sign({ email:request.body["email"] }, "career-carve", { expiresIn: '1h' });
        const meetings=await schedule_model.find({"email":request.body.email})
        return response.status(201).json({ token ,meetings});
    }
    else 
    {
        return response.status(200).send("bed credentilas")
    }

})



function getDateFromHours(time) {
    time = time.split(':');
    let now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), ...time);
}



app.post('/dashboard/student', authenticateJWT, async(req, res) => {
    const decoded = Jwt.verify(req.body.token, "career-carve");
    req.user = decoded;
    const student=await student_model.find({"email":req.user.email},"name email interest_area")
    const meetings=await schedule_model.find({"email":req.user.email})
    const mentors=await mentor_model.find({},"name email interest_area")
    res.status(201).send({student,mentors,meetings});

});
app.post('/dashboard/mentor', authenticateJWT, async (req, res) => {
    const decoded = Jwt.verify(req.body.token, "career-carve");
    req.user = decoded;
    const meetings=await schedule_model.find({"email":req.user.email})
    const mentors=await mentor_model.find({"email":req.user.email},"name email interest_area")
    res.send({mentors,meetings});
});

app.post('/logout', (req, res) => {
    console.log("logut")
    const token = req.body.headers['x-auth-token'];
    
    return res.status(201).send()
});

app.post("/setavailability",async(request,response)=>
{
    const token = request.body.token;
    console.log(token)

    if (!token) {
        return response.status(200).json({ message: 'No token, authorization denied' });
    }
    console.log(request.body)

    try {
        const decoded = Jwt.verify(token, "career-carve");
        request.user = decoded;
        request.body.email=request.user.email
        const mentor=await mentor_model.find({"email":request.body.email})
        if(mentor.length>0)
        {
        let start_time=getDateFromHours(request.body.start_time)
        let end_time=getDateFromHours(request.body.end_time)
        if(start_time>=end_time)
        {
            return response.send("end-time must greater than starttime")
        }
        try{
            const  Availability=await mentor_avalability_model.create(request.body)
            
            return await Availability.save()
            .then((res)=> 
            {
                console.log("saved")
                return response.send("successfull created")
            },
            (error)=> 
            {
                return response.status(200).send("error",error.message)
            })
    
        }
        catch(error)
        {
            response.status(200).send(error.message)
        }
    }
    }
    catch (err) 
        {
            console.log("error",err.message)
            return response.status(200).send("error","Failed to authenticate token.");
        }
        return response.send("error","Failed to authenticate token.");
})

app.post("/setmeet",async(request,response)=>
{
    const token = request.body.token;
    console.log(token)

    if (!token) {
        return response.status(200).json({ message: 'No token, authorization denied' });
    }
    

    try {
        const decoded = Jwt.verify(token, "career-carve");
        request.user = decoded;
        request.body.student_mail=request.user.email
        let start_time=getDateFromHours(request.body.start_time)
        let end_time=getDateFromHours(request.body.end_time)
        if(start_time>=end_time)
        {
            return response.send("end-time must greater than starttime")
        }
        if(end_time-start_time>3600000)
        {
            return response.send("meet-time should be lessthan 1 hour ")
        }
        

        let meetings_day=await mentor_avalability_model.find({"date":request.body.date}," start_time end_time")
        let schedules_day=await schedule_model.find({"mentor_mail":request.body.mentor_mail,"date":request.body.date},"start_time end_time")
        let crash=false
        if(meetings_day.length>0)
        {
            if(meetings_day[0].start_time>request.body.start_time  || meetings_day[0].end_time <request.body.end_time)
            {
                crash=true
                return response.send("invalid time slot mentor is available from "+meetings_day[0].start_time+" to " +meetings_day[0].end_time)
            }
        }
        if(schedules_day.length>0)
        {
            schedules_day.map((schedule)=>
            {
                console.log("schedule",schedule.start_time<=request.body.start_time<=schedule.end_time || schedule.start_time <=request.body.end_time<=schedule.end_time)
                if(schedule.start_time<=request.body.start_time && request.body.start_time<schedule.end_time )
                {

                    crash=true
                    return response.send("time slot is not avalable from "+request.body.start_time+" to " +request.body.end_time)
                }
            })
            
        }

        if(! crash )
        {
        if(end_time-start_time==100*60*60*30 || end_time-start_time==100*60*60*45 || end_time-start_time==100*60*60*60)
        {

        
        console.log(meetings_day,schedules_day)
        try{
            const  meet=await schedule_model.create(request.body)
            
            return await meet.save()
            .then((res)=> 
            {
                console.log("saved")
                return response.send("successfull created")
            },
            (error)=> 
            {
                return response.status(200).send("error",error.message)
            })
    
        }
        catch(error)
        {
            response.status(200).send(error.message)
        }
    }}
}
    catch (err) 
        {
            console.log("error",err.message)
            
        }

})

app.post("/payment",async(request,response)=>
{
    const token = request.headers.token
    console.log(token)

    if (!token) {
        return response.status(200).json({ message: 'No token, authorization denied' });
    }
   // console.log(request.body)


    try {
        const decoded = Jwt.verify(token, "career-carve");
        request.user = decoded;
        //console.log(request.user)
        const schedule=await schedule_model.find({"date":request.body.date,"student_mail":request.body.student_mail})
        if(schedule.length>0)
        {
            
            let start_time=getDateFromHours(request.body.start_time)
        let end_time=getDateFromHours(request.body.end_time)
        console.log(end_time-start_time , 1000*60*60 )//&& request.body.amount==2000 ) || (end_time-start_time == 100*60*60*45 && request.body.amount==3000 ) || (end_time-start_time == 100*60*60*60 && request.body.amount==3000 ))
        if ( (end_time-start_time == 1000*60*30 && request.body.amount==2000 ) || (end_time-start_time == 1000*60*45 && request.body.amount==3000 ) || (end_time-start_time == 1000*60*60 && request.body.amount==3000 ))
        {
        try{
            
            const  payment=await payment_model.create(request.body)
            return await payment.save()
            .then((res)=> 
            {
                console.log("saved")
                return response.send("successfull created")
            },
            (error)=> 
            {
                console.log("error",error.message)
                return response.status(200).send("error",error.message)
            })
    
        }
        catch(error)
        {
            console.log("error",error.message)
            response.status(200).send(error.message)
        }
    }
    else
    {
        return response.send("invalid amount")
    }
    }
    else 
    {
        return response.send("meeting not found")
    }
    }
    catch (err) 
        {
            console.log("error",err.message)
            return response.status(200).send("error","Failed to authenticate token.");
        }
        
return response.send("invalid amount")
})

app.get("/payment",async(request,response)=>
{
    const token = request.headers.token
    console.log(token)

    if (!token) {
        return response.status(200).json({ message: 'No token, authorization denied' });
    }
    console.log(request.body)

    try {
        const decoded = Jwt.verify(token, "career-carve");
        request.user = decoded;
        try{
            const  schedules=await schedule_model.find({"student_mail":request.user.email})
            const  payments=await payment_model.find({"student_email":request.user.email})
            return response.send({schedules,payments})
    
        }
        catch(error)
        {
            response.status(200).send(error.message)
        }
    }
    catch (err) 
        {
            console.log("error",err.message)
            return response.send("error","Failed to authenticate token.");
        }
        return response.status(200).send("error","Failed t0 authenticate token.");
})


app.listen(port,async()=>
{
    console.log(`listening on ${port}`)
})

