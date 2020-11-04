const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// mongodb connection
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//to remove DeprecationWarning: Mongoose: `findOneAndUpdate()` and `findOneAndDelete()` without the `useFindAndModify` option set to false are deprecated
mongoose.set('useFindAndModify', false);

// creating schema
const itemsSchema = {
  name: String
};
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// creating model
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Be Happy"
});

const item2 = new Item({
  name: "Stay Healthy"
});

const item3 = new Item({
  name: "Stay Focused"
});

const defaultItems = [item1, item2, item3];


app.get("/", function(req, res) {
  Item.find({}, function(err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (!err) {
          console.log("Items inserted successfully");
        } else {
          console.log(err);
        }
      });
      res.redirect('/');
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: items
      });
    }
  });
});

app.get("/:listName", function(req, res) {
  const listName = _.capitalize(req.params.listName);
  List.findOne({
    name: listName
  }, function(err, list) {
    if (!err) {
      if (!list) {
        console.log(listName + " Does not Exists ..");
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        console.log(list.name + " Exists ..");
        res.render("list", {
          listTitle: list.name,
          newListItems: list.items
        });
      }
    }
  });
});

app.post("/", function(req, res) {

  const item = req.body.newItem;
  const listName = req.body.listName;

  const addItem = new Item({
    name: item
  });
  if (listName === "Today") {
    // Item.insertMany(addItem, function(err){
    // });
    // Above two lines can be replaced by a single commond below
    addItem.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, list){
      if(list){
        list.items.push(addItem);
        list.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function(req, res) {
  const id = req.body.deleteItem;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(id, function(err) {
      if (err) {
        console.log(err);
      }
      res.redirect('/');
    });
  }else{
    List.findOneAndUpdate({name: listName},{$pull:{items:{_id: id}}}, function(err, item){
      if(!err){
        res.redirect('/' + listName);
      }
    });
  }

});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
