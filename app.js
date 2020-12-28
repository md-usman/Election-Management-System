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
    con.query(`SELECT  COUNT(VR.voter_id) total, (SELECT COUNT(p_id) FROM VOTES) votes,(SELECT COUNT(ward_id) FROM WARD) wards,(SELECT COUNT(P.p_id) FROM PARTY P)party FROM VOTER VR;SELECT gender, count(*) total FROM VOTER GROUP BY gender`,function(err,result) {
        if(!err) {
            res.render("admin/admin", {
                stats: result[0][0],
                gender: result[1]
            })
        } else {
            console.log(err);
        }
    })
});

//--------------------------------------------|| RESULT ROUTES FOR ADMIN ||-------------------------------------------------------||

app.get("/admin/result", function(req, res) {
    con.query(`select W.ward_id, ward_name, (select count(voter_id) from VOTER V WHERE V.ward_id=W.ward_id ) voters from WARD W, VOTER group by W.ward_id order by W.ward_id;SELECT P.ward_id,P.p_id, P.pname, (select count(V.p_id) from VOTES V where P.p_id=V.p_id) votes from PARTY P order by P.ward_id ASC, votes DESC`,function(err,result) {
        if(!err) {
            res.render("admin/result/result", {
                header: result[0],
                body: result[1]
            })
        
        } else {
            console.log(err);
        }
    })

})

//--------------------------------------------|| USER ROUTES FOR ADMIN ||-------------------------------------------------------||

app.get("/admin/users", function(req, res) {
    var message = ""
    if(req.query.value) {
        message = {"value" : req.query.value};
        JSON.stringify(message);
    }
    con.query("SELECT voter_id, fname, lname, age, ward_id FROM VOTER", function(err, result) {
        if(!err) {
            res.render("admin/users/viewUser", {
                voters: result,
                message: message
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
    var message = ""
    if(req.query.value) {
        message = {"value" : req.query.value};
        JSON.stringify(message);
    }

    con.query(`SELECT ward_id from WARD`, function(err, result) {
        if(err) {
            console.log(err);
        } else {
            res.render("admin/users/add-user", {
                wards: result,
                voter: "",
                message: message
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
            res.redirect("/admin/add-user/?value=user id already exists")
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
                voter: result[0][0],
                message: ""
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

app.post("/admin/add-mod", function(req,res) {
    const mod_id = req.body.mod_id;
    const voter_id = req.body.voter_id;
    con.query(`SELECT voter_id FROM VOTER WHERE voter_id=${voter_id}`,function(err,result) {
        if(!err) {
            if(result.length === 0) {
                res.redirect("/admin/moderator/?value=Invalid Voter Id");
            } else {
                con.query(`SELECT leader FROM PARTY WHERE leader=${voter_id}`,function(err, result) {
                    if(!err) {
                        if(result.length === 0) {
                            con.query(`SELECT m_id FROM MODERATOR WHERE voter_id=${voter_id}`,function(err, result) {
                                if(!err) {
                                    if(result.length !== 0 ) {
                                        res.redirect("/admin/moderator/?value=Moderator Already Exists");
                                    } else {
                                        con.query(`INSERT INTO MODERATOR VALUES(${mod_id},'moderator',${voter_id})`,function(err, result) {
                                            if(!err) {
                                                res.redirect(`/admin/moderator/?value=successfully added modeartor Id: ${mod_id} `);
                                            } else {
                                                res.redirect(`/admin/moderator/?value=Moderator Id Already Exists`);
                                                console.log(err);
                                            }
                                        })
                                    }
                                } else {
                                    console.log(err);
                                }
                            })
                        } else {
                            res.redirect("/admin/moderator/?value=Party Leader Cannot be Moderator")
                        }
                    }else {
                        console.log(err);
                    }
                })
            }
        } else {
            console.log(err);
        }
    })
});

app.get("/admin/moderator",function(req, res) {
    var message = ""
    if(req.query.value) {
        message = {"value" : req.query.value};
        JSON.stringify(message);
    }
    con.query(`select m_id, fname, lname, M.voter_id from MODERATOR M , VOTER V WHERE M.voter_id=V.voter_id`,function(err, result) {
        if(!err) {
            res.render("admin/moderator/moderator", {
                moderator: result,
                message: message
            })
        } else {
            console.log(err);
        }
    })
    
})

//--------------------------------------------|| PARTY ROUTES FOR ADMIN ||-------------------------------------------------------||

app.get("/admin/party",function(req, res) {
    var message = "";
    if(req.query.value) {
        message = {"value" :req.query.value};
        JSON.stringify(message)
    }
    const sql = "SELECT * FROM PARTY";
    con.query(sql,function(err,result) {
        if(!err) {
            res.render("admin/party/party", {
                parties: result,
                message: message
            });
        } else {
            console.log(err);
        }
    })
    
})

app.post("/admin/party/add-del", function(req,res) {
    const method = req.body.meth;
    if(method === 'delete') {
        const p_id = req.body.p_id;
        con.query(`DELETE FROM PARTY WHERE p_id=${p_id}`,function(err) {
            if(!err) {
                res.redirect(`/admin/party/?value=Successfully Deleted Party Id: ${p_id}`);
            }
            else {
                console.log(err);
            }
        })
    } else {
        const reqWard = req.body.ward;
        const p_id = req.body.pid;
        const pname = req.body.pname;
        const leader = req.body.leader;
        con.query(`SELECT voter_id, ward_id FROM VOTER WHERE voter_id=${leader}`,function(err,result) {
            if(!err) {
                if(result.length === 0) {
                    res.redirect("/admin/add-party/?value=The VOTER does not Exist...")
                } else {
                    const ward = JSON.stringify(result[0].ward_id);
                    console.log(ward);
                    console.log(reqWard);
                    if(ward === reqWard) {
                        con.query(`SELECT leader FROM PARTY WHERE leader=${leader}`,function(err,result1) {
                            if(result1.length === 0) {
                                con.query(`INSERT INTO PARTY VALUES(${p_id},'${pname}',${leader},${reqWard})`,function(err) {
                                    if(!err) {
                                        res.redirect(`/admin/party/?value=Successfully added Party Id: ${p_id}`);
                                    } else {
                                        console.log(err);
                                        res.redirect("/admin/add-party/?value=Party Id already present");
                                    }
                                })
                            } else {
                                res.redirect("/admin/add-party/?value=Voter already a Leader for Other Party");
                            }
                        })
                        
                    } else {
                        res.redirect("/admin/add-party/?value=Leader does not belong to the ward")
                    }
                }
                
            } else {
                console.log(err);
            }
        })
         
    }
});

app.get("/admin/add-party",function(req,res) {
    var message = "";
    if(req.query.value) {
        message = {"value":req.query.value};
        JSON.stringify(message);
    }
    con.query(`SELECT ward_id FROM WARD`,function(err,result) {
        res.render("admin/party/add-party", {
            wards: result,
            message: message
        });
    })
})

//--------------------------------------------|| WARD ROUTES FOR ADMIN ||-------------------------------------------------------||

app.route("/admin/wards")

.get(function(req, res) {
    var message = "";
    if(req.query.value) {
        var message = {"value" : req.query.value};
        JSON.stringify(message);
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

//--------------------------------------------|| USER ROUTES FOR MODERATOR ||------------------------------------------------------||

app.get("/moderator/:id",function(req, res) {
    var message = "";
    if(req.query.value) {
        var message = {"value" : req.query.value};
        JSON.stringify(message);
    } 
    const mod_id = req.params.id;
    con.query(`select A.m_id, V.voter_id, fname, lname,age,ward_id from VOTER V, ADD_USER A where m_id=${mod_id} and V.voter_id=A.voter_id`,function(err, result) {
        if(!err) {
            res.render("moderator/moderator", {
                voters: result,
                m_id: result[0],
                message: message
            })
        } else {
            console.log(err);
        }
    })
});



//--------------------------------------------|| VOTING ROUTES FOR VOTERS ||-------------------------------------------------------||

app.get("/vote",function(req, res) {
    con.query(`Select * from PARTY`, function(err, result) {
        if(!err) {
            res.render("voting/vote", {
                parties: result
            })
            
        } else {
            console.log(err);
        }
    })
    
})





app.listen(3000, function() {
    console.log("Election server started");
});