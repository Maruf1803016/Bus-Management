var express = require('express');
var ejs = require('ejs');
var mysql = require('mysql');
var bp = require('body-parser');
var sessions = require('express-session');
var cookieParser = require( 'cookie-parser' );
const multer = require('multer');

mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'bus'
});

const storage=multer.diskStorage({
    destination:(req,file,cb)=> {
        cb(null,'./public/img');
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+file.originalname);
    },
});
const upload=multer({storage:storage});

var app=express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static('public'));
app.set('view engine','ejs');
app.locals.baseURL = "http://localhost:3000"

const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

var adminauth=(req,res,next)=>{
    if(req.session.logged && req.session.role=='Admin'){
        next()
    }
    else{
        res.redirect('/admin/login')
    }
}
var driverauth=(req,res,next)=>{
    if(req.session.logged && req.session.role=='Driver'){
        next()
    }
    else{
        res.redirect('/driver/login')
    }
}
var userauth=(req,res,next)=>{
    if(req.session.logged && req.session.role=='User'){
        next()
    }
    else{
        res.redirect('/login')
    }
}
var auth=(req,res,next)=>{
    if(req.session.logged){
        next()
    }
    else{
        res.redirect('/login')
    }
}

var con =  mysql.createConnection({
        host:'localhost',
        user:'root',
        password:'',
        database:'bus'
    });

app.listen(3000);
app.use(bp.urlencoded({extends:true}));
app.use(express.static(__dirname + "/public"));
app.use(express.static("."));


app.get('/',function(req,res){    
    return res.render('pages/index');
} );
// admin route


app.get('/admin/login',function(req,res){    
    return res.render( 'pages/admin/login' );
});

app.post( '/admin/log-in', ( req, res ) => {
    var email = req.body.email;
    var password = req.body.password;
    con.query( `SELECT id FROM admin WHERE email='${ email }' AND password='${ password }'`, ( e, r ) => {
        if ( r ) {
            req.session.userid = r[ 0 ].id;
            req.session.logged = true;
            req.session.role='Admin'
            res.redirect( '/admin-vehiclesandroutes' );
        }
        else {
            res.redirect( '/admin/login' );
        }
    } ); 
} );

app.get( '/admin-vehiclesandroutes',adminauth, function ( req, res ) {
    con.query( "SELECT * FROM vehicles", ( e, result ) => {
        return res.render( 'pages/admin/vehiclesandroutes', {
            vehicles: result,
        } );
    } );

} );
app.get('/vehicles-delete/:id',adminauth,function(req,res){
    let id=req.params.id;
    con.query(`DELETE FROM vehicles WHERE id='${id}'`,function(e,result){
        return res.redirect('back');
    });
});
app.get( '/admin-drivers',adminauth, function ( req, res ) {
    con.query( "SELECT * FROM driver", ( e, result ) => {
        return res.render( 'pages/admin/drivers', {
            drivers: result,
        } );
    } );

} );
app.get('/drivers-delete/:id',adminauth,function(req,res){
    let id=req.params.id;
    con.query(`DELETE FROM driver WHERE id='${id}'`,function(e,result){
        return res.redirect('back');
    });
});
app.get( '/admin-users',adminauth, function ( req, res ) {
    con.query( "SELECT * FROM user", ( e, result ) => {
        return res.render( 'pages/admin/users', {
            users: result,
        } );
    } );

} );
app.get('/users-delete/:id',adminauth,function(req,res){
    let id=req.params.id;
    con.query(`DELETE FROM user WHERE id='${id}'`,function(e,result){
        return res.redirect('back');
    });
});

// Driver route


app.get('/driver/login',function(req,res){    
    return res.render( 'pages/driver/login' );
});

app.post( '/driver/log-in', ( req, res ) => {
    var email = req.body.email;
    var password = req.body.password;
    con.query( `SELECT id FROM driver WHERE email='${ email }' AND password='${ password }'`, ( e, r ) => {
        if ( r ) {
            req.session.userid = r[ 0 ].id;
            req.session.logged = true;
            req.session.role='Driver'
            res.redirect( '/driver-details' );
        }
        else {
            res.render( 'pages/driver/login' );
        }
    } ); 
} );

app.get('/driver-register',function(req,res){    
    return res.render( 'pages/user/register' );
});



app.post( '/register-driver',  function ( req, res ) {

    con.query(`INSERT INTO user(name,email,password,phone,age) VALUES('${ req.body.name }' ,'${ req.body.email }','${ req.body.password }','${ req.body.phone }','${ req.body.age }')`,(e,result)=>{
        if ( e ) {
            return res.send(e)
        }
        else {
            con.query( `SELECT id FROM user WHERE email='${ email }' AND password='${ password }'`, ( e, r ) => {
                if ( r ) {
                    req.session.userid = r[ 0 ].id;
                    req.session.logged = true;
                    req.session.role='Driver'
                    res.redirect( '/driver-details' );
                }
                else {
                    res.render( 'pages/driver/register' );
                }
            } ); 
        }
    }); 
});

app.get( '/driver-details',driverauth, function ( req, res ) {
    con.query( `SELECT * FROM driver WHERE id=${req.session.userid}`, ( e, result ) => {
        return res.render( 'pages/driver/details', {
            driver: result[0],
        } );
    } );

} );

// User route


app.get('/login',function(req,res){    
    return res.render( 'pages/user/login' );
});

app.post( '/log-in', ( req, res ) => {
    var email = req.body.email;
    var password = req.body.password;
    con.query( `SELECT id FROM user WHERE email='${ email }' AND password='${ password }'`, ( e, r ) => {
        if ( r ) {
            req.session.userid = r[ 0 ].id;
            req.session.logged = true;
            req.session.role='User'
            res.redirect( '/bus-list' );
        }
        else {
            res.render( 'pages/user/login' );
        }
    } ); 
} );

app.get('/user-register',function(req,res){    
    return res.render( 'pages/user/register' );
});



app.post( '/register-user',  function ( req, res ) {

    con.query(`INSERT INTO user(name,email,password,phone,designation,address) VALUES('${ req.body.name }' ,'${ req.body.email }','${ req.body.password }','${ req.body.phone }','${ req.body.destination }','${ req.body.address }')`,(e,result)=>{
        if ( e ) {
            return res.send(e)
        }
        else {
            con.query( `SELECT id FROM user WHERE email='${ email }' AND password='${ password }'`, ( e, r ) => {
                if ( r ) {
                    req.session.userid = r[ 0 ].id;
                    req.session.logged = true;
                    req.session.role='User'
                    res.redirect( '/bus-list' );
                }
                else {
                    res.render( 'pages/user/register' );
                }
            } ); 
        }
    }); 
});
app.get('/bus-list',userauth,function(req,res){    
    con.query( `SELECT * FROM vehicles`, ( e, result ) => {
        return res.render( 'pages/user/bus-list', {
            bus: result,
        } );
    } );
});
app.get('/apply:id',userauth,function(req,res){    
    con.query( `SELECT * FROM vehicles WHERE id=${req.params.id}`, ( e, result ) => {
        return res.render( 'pages/user/apply', {
            bus: result[0],
        } );
    } );
});
app.post('/apply-bus',userauth,function(req,res){    
    con.query( `INSERT INTO vehicles(user_id,username,date,given,bus_no,details) VALUES(${req.session.userid},'${req.body.name}','${req.body.date}',0,${req.body.bus_no},${req.body.details},)`, ( e, result ) => {
        return res.redirect( 'back');
    } );
});

app.get('/logout',auth,(req,res)=>{
    if(req.session.logged){
        req.session.logged=false
        req.session.id = null
        req.session.role=null
        res.redirect('/');
        return
    }
})

