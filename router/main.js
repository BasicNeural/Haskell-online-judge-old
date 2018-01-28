module.exports = function(app)
{
     app.get('/',function(req,res){
        res.render('index.html')
     });
     app.get('/exercise:id', function(req,res) {
        let souce = JSON.parse(fs.writeFileSync(`./exercise/${id}.json`));
        res.render('template', {
            title: souce.title,
            template: souce.template,
            test: souce.test
        });
     });
}