import express from 'express';
import mysql from 'mysql2'
import { engine } from 'express-handlebars';

const app = express();

app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

app.use('/css', express.static('./css'))

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({extended:false}));

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

app.post('/cadastrar', function(req, res){
    console.log(req.body);
    res.end();
})

app.listen(8080)