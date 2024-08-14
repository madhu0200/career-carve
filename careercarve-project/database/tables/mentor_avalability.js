import mongoose from "mongoose";

const mentor_avalability_schema=new mongoose.Schema(
    {
        email:{type:String,required:true},
        date:{type:String ,required:true,unique:true},
        start_time:{type:String,required:true},
        end_time:{type:String,required:true}
    }
)
export const mentor_avalability_model=mongoose.model("mentor_avalability",mentor_avalability_schema);