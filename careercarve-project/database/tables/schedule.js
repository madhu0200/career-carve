import mongoose from "mongoose";

const schedule_schema=new mongoose.Schema(
    {
        date:{type:String,required:true},
        start_time:{type:String,required:true},
        end_time:{type:String,required:true},
        student_mail:{type:String,ref:"student_model",required:true},
        mentor_mail:{type:String,ref:"mentor_model",required:true}, 
    }
)
export const schedule_model=mongoose.model("schedules",schedule_schema)