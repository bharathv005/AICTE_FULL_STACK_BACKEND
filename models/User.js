const mongoose=require('mongoose')

const UserSchema=mongoose.Schema({
    username:{type:String,require:true},
    email:{type:String,require:true},
    password:{type:String,require:true},
    savedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }]
})

module.exports=mongoose.model('User',UserSchema)


