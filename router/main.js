module.exports = function(app)
{
     app.get('/',function(req,res){
        res.render('index.html')
     });
     app.get('/exercise:id', function(req,res){
        res.render('index.html')
     });
}