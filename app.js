//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _=require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

mongoose.connect("mongodb://localhost:27017/todolistdb", {
  useNewUrlParser: true,
});

const itemSchema = new mongoose.Schema({
  Name: String,
});

const ListSchema =new mongoose.Schema({
  Name : String,
  Item : [itemSchema]
});

const List= mongoose.model("List",ListSchema);

const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
  Name: "welcome to new todo list",
});
const item2 = new Item({
  Name: "Hit the + button to add Item",
});
const item3 = new Item({
  Name: "<-- Hit this to delete an Item",
});
constDefaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  const day = date.getDate();
  Item.find({}).then(foundItems => {
    if (foundItems.length === 0) {
      Item.insertMany(constDefaultItems)
        .then(function () {
          console.log("Successfully saved defult items to DB");
        })
        .catch(function (err) {
          console.log(err);
        });
      res.redirect("/");
    } 
    else {
      res.render("list", { listTitle: day, newListItems: foundItems });
    }
  });
});

app.get("/:customListName",function(req,res){
  const customListName=_.capitalize(req.params.customListName);
  List.findOne({Name:customListName})
    .then(foundList =>{
      if(!foundList){
        const list=new List({
          Name:customListName,
          Item:constDefaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        res.render("list",{ listTitle: foundList.Name, newListItems: foundList.Item })
      }
        
    })
  
});

app.post("/", function (req, res) {
  const day = date.getDate();
  const itemName = req.body.newItem;
  const listname=req.body.list; 
  const item = new Item({
    Name: itemName,
  });
  if(listname===day){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({Name:listname})
    .then(foundList => {
      foundList.Item.push(item);
      return foundList.save();
    })
    .then(savedList => {
      res.redirect("/" + listname);
    })
  }
});

app.post("/delete",function(req,res){
  const day=date.getDate();
  const checkItemId=req.body.checkbox;
  const listName=req.body.listName;
  if(listName===day){
    Item.findByIdAndDelete(checkItemId)
      .then(function(){
        console.log("deleted");
      })
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({Name:listName},{$pull:{Item:{_id:checkItemId}}})
    .then(foundList=>{
        res.redirect("/"+listName);
    }
    )
  }

});


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
