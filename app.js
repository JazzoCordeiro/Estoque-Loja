import express from 'express';
import mysql from 'mysql2'
import { engine } from 'express-handlebars';

const app = express();

app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

const configDB = mysql.createConnection({
    host: 'localhost',
    user:'root',
    password: '1234',
    database: 'fullStack'
})

configDB.connect(function(erro){
    if(erro) throw erro;
    console.log('conexão feita com sucesso')
})

app.get('/', function(req, res){
    res.render('formulario')
})

app.listen(8080)