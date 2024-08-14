import mongoose from "mongoose";

const student_schema=new mongoose.Schema(
    {
        name:{type:String,required:true},
        email:{type:String,required:true,unique:true},
        password:{type:String,required:true},
        interest_area:{type:Array,required:true}
    }
)
export const student_model=mongoose.model("student",student_schema)