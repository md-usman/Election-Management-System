//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");
const {
    json
} = require('body-parser');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
    CONNREFUSED
} = require('dns');

const con = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USR,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    multipleStatements: true
});

con.connect(function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log("sql connected");
    }
});

const app = express();
var adminArray = [];
var moderatorArray = [];
var voterArray = [];

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + "/public"));

const Storage = multer.diskStorage({
    destination: './public/uploads',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
})

const upload = multer({
    storage: Storage
});

app.get("/", function (req, res) {
    con.query(`select election_status from ADMIN `, function(err, result) {
        if(!err) {
            var status = "";
            JSON.stringify(result);
            res.render("home", {
                ele_status: result[0].election_status
            });
        } else {
            console.log(err);
        }
    })
    
})



//--------------------------------------------|| ADMIN DASHBOARD ||-------------------------------------------------------||

app.get("/admin", adminAuth, function (req, res) {
    con.query(`SELECT  COUNT(VR.voter_id) total, (SELECT COUNT(p_id) FROM VOTES) votes,(SELECT COUNT(ward_id) FROM WARD) wards,(SELECT COUNT(P.p_id) FROM PARTY P)party FROM VOTER VR;SELECT gender, count(*) total FROM VOTER GROUP BY gender`, function (err, result) {
        if (!err) {
            res.render("admin/admin", {
                stats: result[0][0],
                gender: result[1]
            })
        } else {
            console.log(err);
        }
    })
});

app.post("/admin/login", function (req, res) {
    const admin_name = req.body.admin_id;
    const pass = req.body.password;
    con.query(`select admin_id, password from ADMIN where admin_id='${admin_name}'`, function(err, result) {
        if(!err) {
            if(result.length === 0) {
                res.redirect("/admin/login/?value=User not fond");
                return;
            }
            JSON.stringify(result);
            if(result[0].admin_id === admin_name && result[0].password === pass) {
                adminArray = [];
                var adminAuth = {"admin": "logged"};
                adminArray.push(adminAuth);
                res.redirect("/admin");
            } else {
                res.redirect("/admin/login?value=User name and pasword do not match");
            }
        } else {
            console.log(err);
        }
    })
})
app.get("/admin/login", function(req, res) {
    if(adminArray.length !== 0) {
        if(adminArray[0].admin !== null) {
            res.redirect("/admin");
        }
    } else {
        var message = "";
    if (req.query.value) {
        var message = {
            "value": req.query.value
        };
        JSON.stringify(message);
    }
    res.render("admin/login", {
        message: message
    });
    }
    
})

app.post("/logout/admin", function(req,res) {
    adminArray = [];
    res.redirect("/");
})

//--------------------------------------------|| RESULT AND LOG ROUTES FOR ADMIN ||---------------------------------------------||

app.get("/admin/result", adminAuth, function (req, res) {
    con.query(`select W.ward_id, ward_name, (select count(voter_id) from VOTER V WHERE V.ward_id=W.ward_id ) voters,(SELECT COUNT(n.p_id) from VOTES n, PARTY m where n.p_id=m.p_id and m.ward_id=W.ward_id) voted from WARD W, VOTER group by W.ward_id order by W.ward_id;SELECT P.ward_id,P.p_id, P.pname, (select count(V.p_id) from VOTES V where P.p_id=V.p_id) votes from PARTY P order by P.ward_id ASC, votes DESC;select election_status from ADMIN`, function (err, result) {
        if (!err) {
            var ele_status = "";
            JSON.stringify(result);
            if(result[2][0].election_status === 'active') {
                ele_status = "true";
            }
            res.render("admin/result/result", {
                header: result[0],
                body: result[1],
                ele_status: ele_status
            })
        } else {
            console.log(err);
        }
    })
})

app.get("/admin/vote-log", adminAuth, function (req, res) {
    con.query(`select * from VOTE_LOG`, function (err, result) {
        if (!err) {
            res.render("admin/result/voteLog", {
                logs: result
            })
        } else {
            console.log(err);
        }
    })
})

//----------------------------------------|| DECLARE RESULT ROUTE FOR ADMIN ||--------------------------------------------------||

app.post("/admin/result-status", adminAuth, function(req, res) {
    con.query(`update ADMIN set election_status = 'inactive'`, function(err) {
        if(!err) {
            res.redirect('back');
        } else {
            console.log(err);
        }
    })    
})

//--------------------------------------------|| USER ROUTES FOR ADMIN ||-------------------------------------------------------||

app.get("/admin/users", adminAuth, function (req, res) {
    var message = ""
    if (req.query.value) {
        message = {
            "value": req.query.value
        };
        JSON.stringify(message);
    }
    con.query("SELECT voter_id, fname, lname, age, ward_id FROM VOTER", function (err, result) {
        if (!err) {
            res.render("admin/users/viewUser", {
                voters: result,
                message: message
            });
        } else {
            console.log(err);
        }
    });
});

app.get("/admin/users/:id", adminAuth, function (req, res) {
    const id = req.params.id;
    var message = ""
    if (req.query.value) {
        message = {
            "value": req.query.value
        };
        JSON.stringify(message);
    }
    con.query(`SELECT * FROM VOTER WHERE voter_id=${id}`, function (err, result) {
        if (!err) {
            res.render("admin/users/user", {
                voter: result[0],
                message: message,
                image: result[0].image.replace(/['"]+/g, '')
            });
        } else {
            console.log(err);
        }
    });
});

app.get("/admin/add-user", adminAuth, function (req, res) {
    var message = ""
    if (req.query.value) {
        message = {
            "value": req.query.value
        };
        JSON.stringify(message);
    }
    var image = "";
    con.query(`SELECT ward_id from WARD`, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            res.render("admin/users/add-user", {
                wards: result,
                voter: "",
                message: message,
                image: image
            });
        }
    })

})

app.post("/admin/add-user", adminAuth, upload.single("image"), function (req, res) {
    const id = req.body.id;
    const fname = req.body.fname.trim();
    const lname = req.body.lname.trim();
    const gender = req.body.gender;
    const age = req.body.age;
    const address = req.body.address.trim();
    const ward = req.body.ward;
    const phno = req.body.phno;
    const image = JSON.stringify(req.file.filename).replace(/['"]+/g, '');
    con.query(`INSERT INTO VOTER VALUES(${id}, "${fname}","${lname}","password","${gender}",${age},"${address}",${ward},${phno},'${image}')`, function (err) {
        if (!err) {
            console.log("successfully added user");
            10
            res.redirect(`/admin/users/?value=successfully added voter Id: ${id}`);
        } else {
            res.redirect("/admin/add-user/?value=user id already exists")
            console.log(err);
        }
    })
});

app.post("/admin/dell-user", adminAuth, function (req, res) {
    const voter_id = req.body.voter_id;
    con.query(`SELECT leader FROM PARTY WHERE leader=${voter_id}`, function (err, result) {
        if (!err) {
            if (result.length === 0) {
                con.query(`select image from VOTER where voter_id=${voter_id}`, function (err, result) {
                    if (!err) {
                        fs.unlink(`public/uploads/${result[0].image.replace(/['"]+/g, '')}`, function (err) {
                            if (!err) {
                                console.log("successfully deleted Image");
                            } else {
                                console.log(err);
                            }
                        })
                        con.query(`DELETE FROM VOTER WHERE voter_id=${voter_id}`, function (err) {
                            if (!err) {
                                res.redirect(`/admin/users/?value=successfully deleted voter id: ${voter_id}`);
                            } else {
                                console.log(err);
                            }
                        });
                    } else {
                        console.log(err);
                    }
                })

            } else {
                res.redirect(`/admin/users/${voter_id}/?value=This user is Party Leader, cannot be removed`);
            }
        }
    })
});

app.post("/admin/update-user", adminAuth, function (req, res) {
    const voter_id = req.body.voter_id;
    con.query(`SELECT voter_id, fname, lname, gender,age,address, ward_id, phone, image  FROM VOTER WHERE voter_id=${voter_id};SELECT ward_id from WARD`, function (err, result) {
        if (!err) {
            res.render("admin/users/add-user", {
                wards: result[1],
                voter: result[0][0],
                message: "",
                image: result[0][0].image.replace(/['"]+/g, '')
            });

        } else {
            console.log(err);
        }
    })
});

app.post("/admin/update-user-D", adminAuth, upload.single("image"), function (req, res) {
    const voter_id = req.body.id;
    const fname = req.body.fname.trim();
    const lname = req.body.lname.trim();
    const gender = req.body.gender;
    const age = req.body.age;
    const address = req.body.address.trim();
    const ward = req.body.ward;
    const phno = req.body.phno;
    if (req.file) {
        con.query(`SELECT image FROM VOTER WHERE voter_id=${voter_id}`, function (err, result) {
            if (!err) {
                fs.unlink(`public/uploads/${result[0].image.replace(/['"]+/g, '')}`, function (err) {
                    if (!err) {
                        console.log("successfully deleted Image");
                    } else {
                        console.log(err);
                    }
                })
            } else {
                console.log(err);
            }
        })
        const image = JSON.stringify(req.file.filename).replace(/['"]+/g, '');
        con.query(`UPDATE VOTER SET fname='${fname}',lname='${lname}',gender='${gender}',age=${age},address='${address}',phone=${phno},ward_id=${ward},image='${image}' WHERE voter_id=${voter_id}`, function (err) {
            if (!err) {
                res.redirect(`/admin/users/${voter_id}/?value=Updated successfully`);
            } else {
                console.log(err);
            }
        })
    } else {

        con.query(`UPDATE VOTER SET fname='${fname}',lname='${lname}',gender='${gender}',age=${age},address='${address}',phone=${phno},ward_id=${ward} WHERE voter_id=${voter_id}`, function (err) {
            if (!err) {
                res.redirect(`/admin/users/${voter_id}/?value=Updated successfully`);
            } else {
                console.log(err);
            }
        })
    }

});

app.post("/admin/add-mod", adminAuth, function (req, res) {
    const mod_id = req.body.mod_id;
    const voter_id = req.body.voter_id;
    con.query(`SELECT voter_id FROM VOTER WHERE voter_id=${voter_id}`, function (err, result) {
        if (!err) {
            if (result.length === 0) {
                res.redirect("/admin/moderator/?value=Invalid Voter Id");
            } else {
                con.query(`SELECT leader FROM PARTY WHERE leader=${voter_id}`, function (err, result) {
                    if (!err) {
                        if (result.length === 0) {
                            con.query(`SELECT m_id FROM MODERATOR WHERE voter_id=${voter_id}`, function (err, result) {
                                if (!err) {
                                    if (result.length !== 0) {
                                        res.redirect("/admin/moderator/?value=Moderator Already Exists");
                                    } else {
                                        con.query(`INSERT INTO MODERATOR VALUES(${mod_id},'moderator',${voter_id})`, function (err, result) {
                                            if (!err) {
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
                    } else {
                        console.log(err);
                    }
                })
            }
        } else {
            console.log(err);
        }
    })
});

app.get("/admin/moderator", adminAuth, function (req, res) {
    var message = ""
    if (req.query.value) {
        message = {
            "value": req.query.value
        };
        JSON.stringify(message);
    }
    con.query(`select m_id, fname, lname, M.voter_id from MODERATOR M , VOTER V WHERE M.voter_id=V.voter_id`, function (err, result) {
        if (!err) {
            res.render("admin/moderator/moderator", {
                moderator: result,
                message: message
            })
        } else {
            console.log(err);
        }
    })

});

app.post("/admin/moderator/delete", adminAuth, function (req, res) {
    const mod_id = req.body.mod_id;
    con.query(`DELETE FROM MODERATOR WHERE m_id=${mod_id}`, function (err) {
        if (!err) {
            res.redirect(`/admin/moderator/?value=Deleted Moderator Id: ${mod_id}`);
        } else {
            console.log(err);
        }
    })
})

//--------------------------------------------|| PARTY ROUTES FOR ADMIN ||-------------------------------------------------------||

app.get("/admin/party", adminAuth, function (req, res) {
    var message = "";
    if (req.query.value) {
        message = {
            "value": req.query.value
        };
        JSON.stringify(message)
    }
    const sql = "SELECT * FROM PARTY";
    con.query(sql, function (err, result) {
        if (!err) {
            res.render("admin/party/party", {
                parties: result,
                message: message
            });
        } else {
            console.log(err);
        }
    })

})

app.post("/admin/party/add-del", adminAuth, upload.single("logo"), function (req, res) {
    const method = req.body.meth;
    if (method === 'delete') {
        const p_id = req.body.p_id;
        con.query(`select logo from PARTY where p_id=${p_id}`, function (err, result) {
            if (!err) {
                if (result[0] !== null) {
                    fs.unlink(`public/uploads/${result[0].logo.replace(/['"]+/g, '')}`, function (err) {
                        if (!err) {
                            console.log("successfully deleted Image");
                        } else {
                            console.log(err);
                        }
                    })
                }
            } else {
                console.log(err);
            }
        })
        con.query(`DELETE FROM PARTY WHERE p_id=${p_id}`, function (err) {
            if (!err) {
                res.redirect(`/admin/party/?value=Successfully Deleted Party Id: ${p_id}`);
            } else {
                console.log(err);
            }
        })
    } else {
        const reqWard = req.body.ward;
        const p_id = req.body.pid;
        const pname = req.body.pname;
        const leader = req.body.leader;
        const logo = JSON.stringify(req.file.filename).replace(/['"]+/g, '');
        con.query(`SELECT voter_id, ward_id FROM VOTER WHERE voter_id=${leader}`, function (err, result) {
            if (!err) {
                if (result.length === 0) {
                    res.redirect("/admin/add-party/?value=The VOTER does not Exist...")
                } else {
                    const ward = JSON.stringify(result[0].ward_id);
                    console.log(ward);
                    console.log(reqWard);
                    if (ward === reqWard) {
                        con.query(`SELECT leader FROM PARTY WHERE leader=${leader}`, function (err, result1) {
                            if (result1.length === 0) {
                                con.query(`INSERT INTO PARTY VALUES(${p_id},'${pname}',${leader},${reqWard},'${logo}')`, function (err) {
                                    if (!err) {
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

app.get("/admin/add-party", adminAuth, function (req, res) {
    var message = "";
    if (req.query.value) {
        message = {
            "value": req.query.value
        };
        JSON.stringify(message);
    }
    con.query(`SELECT ward_id FROM WARD`, function (err, result) {
        res.render("admin/party/add-party", {
            wards: result,
            message: message
        });
    })
})

//--------------------------------------------|| WARD ROUTES FOR ADMIN ||-------------------------------------------------------||

app.route("/admin/wards")

    .get(adminAuth, function (req, res) {
        var message = "";
        if (req.query.value) {
            var message = {
                "value": req.query.value
            };
            JSON.stringify(message);
        }
        con.query("select w.ward_id, w.ward_name, (select count(p_id) from PARTY p where p.ward_id=w.ward_id) parties, (select count(voter_id) from VOTER v where v.ward_id=w.ward_id) voters from WARD w group by ward_id", function (err, result) {
            if (!err) {
                if (!message) {
                    res.render("admin/ward/ward", {
                        wards: result,
                        message: ""
                    })
                } else {
                    res.render("admin/ward/ward", {
                        wards: result,
                        message: message
                    })
                }
            } else {
                console.log("LOGGING ERR" + err);
            }
        });
    });

app.post("/admin/wards/add-del",adminAuth, function (req, res) {
    const request = req.body.meth;
    if (request === 'delete') {
        const id = req.body.ward_id;
        con.query(`DELETE FROM WARD WHERE ward_id=${id}`, function (err) {
            if (err) {
                console.log(err);
            } else {
                const str = `successfully deleted ward NO: ${id}`;
                console.log(str);
                res.redirect("/admin/wards?value=" + str);
            }
        });
    }
    if (request === 'add') {
        const id = req.body.w_id;
        const name = req.body.wname;
        if ((!id || id.length === 0 || !id.trim()) || (!name || name.length === 0 || !name.trim())) {
            return res.redirect("/admin/wards?value=Feilds cannot be empty");
        }
        con.query(`INSERT INTO WARD VALUES(${id},'${name}')`, function (err) {
            if (err) {
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

//--------------------------------------------|| LOGIN ROUTES FOR MODERATOR ||------------------------------------------------------||

app.get("/moderator/login", function (req, res) {
    var message = "";
    if (req.query.value) {
        var message = {
            "value": req.query.value
        };
        JSON.stringify(message);
    }
    res.render("moderator/login", {
        message: message
    });
})

app.post("/moderator/login", function(req, res) {
    const m_id = req.body.m_id;
    const pass = req.body.password;
    con.query(`select m_id, password from MODERATOR where m_id=${m_id}`, function(err, result) {
        if(!err) {
            if(result.length === 0) {
                res.redirect("/login/?value=Moderator does not exist");
            }
            else {
                JSON.stringify(result);
                if(result[0].password == pass) {
                    moderatorArray = [];
                    var mod = {"m_id": m_id};
                    moderatorArray.push(mod);
                    console.log(moderatorArray);
                    res.redirect(`/moderator/${m_id}`)
                } else {
                    res.redirect("/moderator/login/?value=Moderator id or password does not match");
                }
            }
        } else {
            console.log(err);
        }
    }) 
})

app.post("/mod/logout", function(req, res) {
    moderatorArray = [];
    res.redirect("/");
})

//--------------------------------------------|| USER ROUTES FOR MODERATOR ||------------------------------------------------------||

app.get("/moderator/:m_id",moderatorAuth, function (req, res) {
    var message = "";
    if (req.query.value) {
        var message = {
            "value": req.query.value
        };
        JSON.stringify(message);
    }
    const mod_id = {
        "value": req.params.m_id
    };
    JSON.stringify(mod_id);
    con.query(`select A.m_id, V.voter_id, fname, lname,age,ward_id from VOTER V, ADD_USER A where m_id=${mod_id.value} and V.voter_id=A.voter_id`, function (err, result) {
        if (!err) {
            res.render("moderator/moderator", {
                voters: result,
                m_id: mod_id,
                message: message
            })
        } else {
            console.log(err);
        }
    })
});

app.get("/moderator/viewUser/:m_id/:v_id",moderatorAuth, function (req, res) {
    const id = req.params.v_id;
    var message = ""
    if (req.query.value) {
        message = {
            "value": req.query.value
        };
        JSON.stringify(message);
    }
    const mod_id = {
        "value": req.params.m_id
    };
    JSON.stringify(mod_id);
    con.query(`SELECT * FROM VOTER WHERE voter_id=${id}`, function (err, result) {
        if (!err) {
            res.render("moderator/viewUser", {
                m_id: mod_id,
                voter: result[0],
                message: message,
                image: result[0].image.replace(/['"]+/g, '')
            });
        } else {
            console.log(err);
        }
    });
})

app.get("/moderator/:m_id/add-user",moderatorAuth, function (req, res) {
    var message = "";
    if (req.query.value) {
        var message = {
            "value": req.query.value
        };
        JSON.stringify(message);
    }
    const mod_id = {
        "value": req.params.m_id
    };
    JSON.stringify(mod_id);
    var image = "";
    con.query(`SELECT ward_id from WARD`, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            res.render("moderator/add-user", {
                m_id: mod_id,
                wards: result,
                voter: "",
                message: message,
                image: image
            });
        }
    })
});

app.post("/moderator/:m_id/add-user",moderatorAuth, upload.single("image"), function (req, res) {
    const mod_id = req.params.m_id;
    const id = req.body.id;
    const fname = req.body.fname.trim();
    const lname = req.body.lname.trim();
    const gender = req.body.gender;
    const age = req.body.age;
    const address = req.body.address.trim();
    const ward = req.body.ward;
    const phno = req.body.phno;
    const image = JSON.stringify(req.file.filename).replace(/['"]+/g, '');
    con.query(`INSERT INTO VOTER VALUES(${id}, "${fname}","${lname}","password","${gender}",${age},"${address}",${ward},${phno},'${image}')`, function (err) {
        if (!err) {
            con.query(`INSERT INTO ADD_USER VALUES(${mod_id}, ${id})`, function (err) {
                res.redirect(`/moderator/${mod_id}/?value=Successfully added voter ID: ${id}`);
            })
        } else {
            res.redirect(`/moderator/${mod_id}/add-user/?value=user id already exists`)
            console.log(err);
        }
    })
})

app.post("/moderator/dell-user", function (req, res) {
    const voter_id = req.body.voter_id;
    const mod_id = req.body.mod_id;
    con.query(`SELECT leader FROM PARTY WHERE leader=${voter_id}`, function (err, result) {
        if (!err) {
            if (result.length === 0) {
                con.query(`select image from VOTER where voter_id=${voter_id}`, function (err, result) {
                    if (!err) {
                        fs.unlink(`public/uploads/${result[0].image.replace(/['"]+/g, '')}`, function (err) {
                            if (!err) {
                                console.log("successfully deleted Image");
                            } else {
                                console.log(err);
                            }
                        });
                        con.query(`DELETE FROM VOTER WHERE voter_id=${voter_id}`, function (err) {
                            if (!err) {
                                res.redirect(`/moderator/${mod_id}/?value=successfully deleted voter id: ${voter_id}`);
                            } else {
                                console.log(err);
                            }
                        });
                    } else {
                        console.log(err);
                    }
                })

            } else {
                res.redirect(`/moderator/${mod_id}/${voter_id}/?value=This user is Party Leader, cannot be removed`);
            }
        } else {
            console.log(err);
        }
    })
})

app.post("/moderator/:m_id/update-user",moderatorAuth, function (req, res) {
    const mod_id = {
        "value": req.params.m_id
    };
    JSON.stringify(mod_id);
    const voter_id = req.body.voter_id;
    con.query(`SELECT voter_id, fname, lname, gender,age,address, ward_id, phone, image  FROM VOTER WHERE voter_id=${voter_id};SELECT ward_id from WARD`, function (err, result) {
        if (!err) {
            res.render("moderator/add-user", {
                wards: result[1],
                voter: result[0][0],
                message: "",
                m_id: mod_id,
                image: result[0][0].image.replace(/['"]+/g, '')
            });
        } else {
            console.log(err);
        }
    })
});

app.post("/moderator/:m_id/update-user-D",moderatorAuth, upload.single("image"), function (req, res) {
    const mod_id = req.params.m_id;
    const voter_id = req.body.id;
    const fname = req.body.fname.trim();
    const lname = req.body.lname.trim();
    const gender = req.body.gender;
    const age = req.body.age;
    const address = req.body.address.trim();
    const ward = req.body.ward;
    const phno = req.body.phno;

    if (req.file) {
        con.query(`SELECT image FROM VOTER WHERE voter_id=${voter_id}`, function (err, result) {
            if (!err) {
                fs.unlink(`public/uploads/${result[0].image.replace(/['"]+/g, '')}`, function (err) {
                    if (!err) {
                        console.log("successfully deleted Image");
                    } else {
                        console.log(err);
                    }
                })
            } else {
                console.log(err);
            }
        })
        const image = JSON.stringify(req.file.filename).replace(/['"]+/g, '');
        con.query(`UPDATE VOTER SET fname='${fname}',lname='${lname}',gender='${gender}',age=${age},address='${address}',phone=${phno},ward_id=${ward},image='${image}' WHERE voter_id=${voter_id}`, function (err) {
            if (!err) {
                res.redirect(`/moderator/viewUser/${mod_id}/${voter_id}/?value=Updated successfully`);
            } else {
                console.log(err);
            }
        })
    } else {

        con.query(`UPDATE VOTER SET fname='${fname}',lname='${lname}',gender='${gender}',age=${age},address='${address}',phone=${phno},ward_id=${ward} WHERE voter_id=${voter_id}`, function (err) {
            if (!err) {
                res.redirect(`/moderator/viewUser/${mod_id}/${voter_id}/?value=Updated successfully`);
            } else {
                console.log(err);
            }
        })
    }
})

//--------------------------------------------|| VOTING ROUTES FOR VOTERS ||-------------------------------------------------------||

app.get("/vote/:voter_id",voterAuth, function (req, res) {
    const voter_id = req.params.voter_id;
    con.query(`SELECT voter_id FROM VOTES WHERE voter_id=${voter_id}`, function (err, result) {
        if (!err) {
            if (result.length !== 0) {
                con.query(`select p_id, pname, logo from PARTY P, VOTER V where P.ward_id=V.ward_id and voter_id=${voter_id}; SELECT voter_id, fname, lname,image,ward_id FROM VOTER WHERE voter_id=${voter_id}`, function (err, result) {
                    if (!err) {
                        if (result[0].length === 0) {
                            return res.send("There are no parties in your ward...")
                        }
                        res.render("voting/vote", {
                            voter: result[1][0],
                            voted: {
                                "vote": true
                            },
                            parties: result[0]
                        })
                    } else {
                        console.log(err);
                    }
                })
            } else {
                con.query(`select p_id, pname, logo from PARTY P, VOTER V where P.ward_id=V.ward_id and voter_id=${voter_id}; SELECT voter_id, fname, lname,image,ward_id FROM VOTER WHERE voter_id=${voter_id}`, function (err, result) {
                    if (!err) {
                        if (result[0].length === 0) {
                            return res.send("Voter does not exist")
                        }
                        res.render("voting/vote", {
                            voter: result[1][0],
                            voted: {
                                "vote": false
                            },
                            parties: result[0]
                        })
                    } else {
                        console.log(err);
                    }
                })
            }
        } else {
            console.log(err);
        }
    })
})

app.post("/vote/:voter_id", function (req, res) {
    const id = req.body.voter_id;
    const party_id = req.body.party_id;
    con.query(`INSERT INTO VOTES VALUES(${party_id},${id})`, function (err) {
        if (!err) {
            res.redirect('back');
        } else {
            console.log(err);
        }
    })
})

app.get("/login", function (req, res) {
    var message = "";
    if (req.query.value) {
        var message = {
            "value": req.query.value
        };
        JSON.stringify(message);
    }
    res.render("login", {
        message: message
    });
});

app.post("/login", function(req, res) {
    const voter_id = req.body.voter_id;
    const pass = req.body.password;
    con.query(`select voter_id, password from VOTER where voter_id=${voter_id}`, function(err, result) {
        if(!err) {
            if(result.length === 0) {
                res.redirect("/login/?value=Voter does not exist");
            }
            else {
                JSON.stringify(result);
                if(result[0].password == pass) {
                    voterArray = [];
                    var voter = {"voter_id": voter_id};
                    voterArray.push(voter);
                    console.log(voterArray);
                    res.redirect(`/vote/${voter_id}`)
                } else {
                    res.redirect("/login/?value=Voter id or password does not match");
                }
            }
        } else {
            console.log(err);
        }
    })    
})
app.post("/voter/logout", function(req, res) {
   voterArray = [];
   res.redirect("/")
})

//--------------------------------------------|| RESULT ROUTES FOR VOTERS ||-------------------------------------------------------||

app.get("/result", function (req, res) {
    con.query(`select election_status from ADMIN`, function (err, result) {
        if (!err) {
            JSON.stringify(result);
            if (result[0].election_status === 'active') {
                res.send("Election is ongoing, please vote if you haven't yet.");
            } else {
                con.query(`select W.ward_id, ward_name, (select count(voter_id) from VOTER V WHERE V.ward_id=W.ward_id ) voters,(SELECT COUNT(n.p_id) from VOTES n, PARTY m where n.p_id=m.p_id and m.ward_id=W.ward_id) voted from WARD W, VOTER group by W.ward_id order by W.ward_id ;SELECT P.ward_id,P.p_id, P.pname, (select count(V.p_id) from VOTES V where P.p_id=V.p_id) votes from PARTY P order by P.ward_id ASC, votes DESC `, function (err, result) {
                    if (!err) {
                        res.render("result", {
                            header: result[0],
                            body: result[1]
                        })
                    } else {
                        console.log(err);
                    }
                })
            }
        } else {
            console.log(err);
        }
    })

})

//--------------------------------------------|| BASIC AUTHENTICATION  ||-----------------------------------------------||

function voterAuth(req, res, next) {
    const voter_id = req.params.voter_id;
    if(voterArray.length === 0) {
        res.redirect("/login");
    }
    else if(voterArray[0].voter_id === voter_id) {
        next()
    } else {
        res.redirect("/login");
    }
}

function moderatorAuth(req, res, next) {
    const m_id = req.params.m_id;
    if(moderatorArray.length === 0) {
        res.redirect("/moderator/login")
    }
    else if(moderatorArray[0].m_id === m_id) {
        next()
    } else {
        res.redirect("/moderator/login");
    }
}

function adminAuth(req, res, next) {
    if(adminArray.length === 0 ) {
        res.redirect("/");
    } else if(adminArray[0].admin !== null) {
        next()
    } else {
        res.redirect("/");
    }
}


app.listen(3000, function () {
    console.log("Election server started");
});