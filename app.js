const express = require('express')
const app = express()
const path = require('path')
const public_path = path.join(__dirname,'/public')
const hbs = require('express-handlebars')
require('dotenv').config()

app.use(express.static(public_path))
app.engine('handlebars',hbs({defaultLayout: 'dashboardLayout'}))
app.set('view engine', 'handlebars')
app.use(express.urlencoded({extended: true}))
app.use(express.json())

const indexRoute = require('./routers/index')
const dashboardRoute = require('./routers/dashboard')
app.use('/',indexRoute)
app.use('/dashboard',dashboardRoute)

app.listen(process.env.port,()=>{
    console.log("Program running on  port " + process.env.port) 
})