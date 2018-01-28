let fs = require('fs');

module.exports = function(app)
{
     app.get('/',function(req,res){
        res.render('index.html')
     });
     app.get('/exercise/:id', function(req,res) {
        let buf = fs.writeFileSync(`./exercise/${req.params.id}.json`, 'utf8')
        let souce = JSON.parse(buf);
        res.render('template', {
            title: souce.title,
            template: souce.template,
            test: souce.test
        });
     });
}