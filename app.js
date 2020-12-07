//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");

const con = mysql.createConnection( {
    host: process.env.HOST,
    user: process.env.USR,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

con.connect(function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("sql connected");
    }
});

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res) {
    res.render("home");
})

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/admin", function(req, res) {
    res.render("admin/admin");
});

app.get("/admin/users", function(req, res) {
    // res.render("admin/users")
    con.query("SELECT * FROM users", function(err, result) {
        if(!err) {
            res.render("admin/users", {
                users: result
            });
            
        } else {
            console.log(err);
        }
    });
});

app.get("/admin/users/:id", function(req, res) {
    const id = req.params.id;
    con.query(`SELECT * FROM users WHERE id=${id}`, function(err, result) {
        if(!err) {
            res.render("admin/user", {
                user: result[0]
            });
        } else {
            console.log(err);
        }
    });
});

app.post("/admin/users/delete", function(req, res) {
    const id = req.body.user_id;
    con.query(`DELETE FROM users WHERE id=${id}`, function(err) {
        if(!err) {
            console.log(`successfully deleted user_id: ${id}`);
            res.redirect("/admin/users");
        } else {
            console.log(err);
        }
    });
});

app.get("/admin/add-user", function(req, res) {
    res.render("admin/add-user");
})

app.post("/admin/add-user", function(req, res) {
    const id = req.body.id;
    const fname = req.body.fname;
    const lname = req.body.lname;
    const gender = req.body.gender;
    con.query(`INSERT INTO users VALUES(${id}, "${fname}","${lname}","${gender}")`, function(err) {
        if(!err) {
            console.log("successfully added user");
            res.redirect("/admin/users");
        } else {
            console.log(err);
        }
    })
})

















app.listen(3000, function() {
    console.log("Election server started");
});