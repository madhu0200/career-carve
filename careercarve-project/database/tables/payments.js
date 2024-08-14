import mongoose from "mongoose";

const payment_schema=new mongoose.Schema(
    {
        
        date:{type:String,required:true},
        start_time:{type:String,required:true},
        end_time:{type:String,required:true},
        amount:{type:Number,required:true},
        student_mail:{type:String,required:true},
        mentor_mail:{type:String,required:true}, 
    }
)
export const payment_model=mongoose.model("payment",payment_schema)