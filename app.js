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
    database: process.env.DATABASE,
    multipleStatements: true
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
    var message = ""
    if(req.query.value) {
        message = {"value" : req.query.value};
        JSON.stringify(message);
    }
    con.query(`SELECT * FROM VOTER WHERE voter_id=${id}`, function(err, result) {
        if(!err) {
            res.render("admin/users/user", {
                voter: result[0],
                message: message
            });
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
                wards: result,
                voter: ""
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
});

app.post("/admin/dell-user",function(req,res) {
    const voter_id = req.body.voter_id;
    con.query(`SELECT leader FROM PARTY WHERE leader=${voter_id}`,function(err, result) {
        if(!err) {
            if(result.length === 0) {
                con.query(`DELETE FROM VOTER WHERE voter_id=${voter_id}`,function(err) {
                    if(!err) {
                        res.redirect(`/admin/users/?value=successfully deleted voter id: ${voter_id}`);
                    } else {
                        console.log(err);
                    }
                });
            } else {
                res.redirect(`/admin/users/${voter_id}/?value=This user is Party Leader, cannot be removed`);
            }
        }
    })
});

app.post("/admin/update-user",function(req, res) {
    const voter_id = req.body.voter_id;
    con.query(`SELECT voter_id, fname, lname, gender,age,address, ward_id, phone  FROM VOTER WHERE voter_id=${voter_id};SELECT ward_id from WARD`, function(err, result) {
        if(!err) {
            res.render("admin/users/add-user", {
                wards: result[1],
                voter: result[0][0]
            });
        }
        else {
            console.log(err);
        }
    })
});

app.post("/admin/update-user-D",function(req,res) {
    const voter_id = req.body.id;
    const fname = req.body.fname.trim();
    const lname = req.body.lname.trim();
    const gender = req.body.gender;
    const age = req.body.age;
    const address = req.body.address.trim();
    const ward = req.body.ward;
    const phno = req.body.phno;
    con.query(`UPDATE VOTER SET fname='${fname}',lname='${lname}',gender='${gender}',age=${age},address='${address}',phone=${phno},ward_id=${ward} WHERE voter_id=${voter_id}`, function(err) {
        if(!err) {
            res.redirect(`/admin/users/${voter_id}/?value=Updated successfully`);
        } else {
            console.log(err);
        }
    })
});

//--------------------------------------------|| PARTY ROUTES FOR ADMIN ||-------------------------------------------------------||

app.get("/admin/party",function(req, res) {
    var sql = "SELECT * FROM PARTY";
    con.query(sql,function(err,result) {
        if(!err) {
            res.render("admin/party/party", {
                parties: result,
                message: ""
            });
        } else {
            console.log(err);
        }
    })
    
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
                return res.redirect("/admin/wards?value=Ward already exists");
            } else {
                const str = `success added ward no: ${id}`
                console.log(str);
                res.redirect(`/admin/wards?value=${str}`);
            }
        });
    }
});









app.listen(3000, function() {
    console.log("Election server started");
});