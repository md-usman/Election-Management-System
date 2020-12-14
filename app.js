//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");
const { json } = require('body-parser');

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

//--------------------------------------------|| ADMIN DASHBOARD ||-------------------------------------------------------||

app.get("/admin", function(req, res) {
    res.render("admin/admin");
});


//--------------------------------------------|| USER ROUTES FOR ADMIN ||-------------------------------------------------------||

app.get("/admin/users", function(req, res) {
    con.query("SELECT voter_id, fname, lname, age, ward_id FROM VOTER", function(err, result) {
        if(!err) {
            res.render("admin/users/viewUser", {
                voters: result
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
            res.render("admin/users/user", {
                voters: result
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
    con.query(`SELECT ward_id from WARD`, function(err, result) {
        if(err) {
            console.log(err);
        } else {
            res.render("admin/users/add-user", {
                wards: result
            });
        }
    })
    
})

app.post("/admin/add-user", function(req, res) {
    const id = req.body.id;
    const fname = req.body.fname.trim();
    const lname = req.body.lname.trim();
    const gender = req.body.gender;
    const age = req.body.age;
    const address = req.body.address.trim();
    const ward = req.body.ward;
    const phno = req.body.phno;
    con.query(`INSERT INTO VOTER VALUES(${id}, "${fname}","${lname}","${fname}","${gender}",${age},"${address}",${ward},${phno})`, function(err) {
        if(!err) {
            console.log("successfully added user");
            res.redirect("/admin/users");
        } else {
            console.log(err);
        }
    })
})


//--------------------------------------------|| PARTY ROUTES FOR ADMIN ||-------------------------------------------------------||

app.get("/admin/party",function(req, res) {
    res.render("admin/party/party");
})


//--------------------------------------------|| WARD ROUTES FOR ADMIN ||-------------------------------------------------------||

app.route("/admin/wards")

.get(function(req, res) {
    var message = "";
    if(req.query.value) {
        var message = {"value" : req.query.value};
        JSON.stringify(message);
        console.log(message);
    } 
    con.query("SELECT * FROM WARD",function(err, result) {
        if(!err) {
            if(!message) {
                res.render("admin/ward/ward", {
                    wards : result,
                    message: ""
                })
            } else {
                res.render("admin/ward/ward",{
                    wards: result,
                    message: message
                })
            }
}
        else {
            console.log("LOGGING ERR" + err);
        }
    });
});

app.post("/admin/wards/add-del",function(req, res) {
    const request = req.body.meth;
    if(request === 'delete') {
        const id = req.body.ward_id;
        con.query(`DELETE FROM WARD WHERE ward_id=${id}`,function(err) {
            if(err) {
                console.log(err);
            } else {
                const str = `successfully deleted ward NO: ${id}`;
                console.log(str);
                res.redirect("/admin/wards?value=" + str);
            }
        });
    }
    if(request === 'add') {
        const id = req.body.w_id;
        const name = req.body.wname;
        if((!id || id.length === 0 || !id.trim()) || (!name || name.length === 0 || !name.trim())) {
            return res.redirect("/admin/wards?value=Feilds cannot be empty");
        }
        con.query(`INSERT INTO WARD VALUES(${id},'${name}')`, function(err) {
            if(err) {
                console.log(err);
            } else {
                const str = `success added ward no: ${id}`
                console.log(str);
                res.redirect(`/admin/wards?value=${str}`);
            }
        });
    }
});



app.get("/sample",function(req,res) {
    if(req.query.value && req.query.type) {
        var mes = {
            "value" : req.query.value,
            "type" : req.query.type
        }
        res.send(JSON.stringify(mes));
    }
    else {
        res.send("value not present");
    }
})







app.listen(3000, function() {
    console.log("Election server started");
});