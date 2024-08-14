import mongoose from "mongoose";

const mentor_schema=new mongoose.Schema(
    {
        name:{type:String,required:true},
        email:{type:String,required:true,unique:true},
        password:{type:String,required:true},
        interest_area:{type:Array,required:true},
    }
)
export const mentor_model=mongoose.model("mentor",mentor_schema)