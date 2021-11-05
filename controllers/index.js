module.exports = {
    getIndex: (req,res)=>{
        res.render('index', {layout: false})
    }
}