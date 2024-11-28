import express from 'express';
import mysql from 'mysql2';
import { engine } from 'express-handlebars';
import fileupload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'




const app = express();

// Necessário para funcionar o __dirname com ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(fileupload());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));
app.use('/css', express.static('./css'));
app.use('/imagens', express.static('./imagens')); // para acessar imagens



// View engine
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Banco de dados
const configDB = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'fullStack'
});

configDB.connect((erro) => {
    if (erro) throw erro;
    console.log('Conexão feita com sucesso');
});

// Rota principal
app.get('/', (req, res) => {
    const { sucesso, erro } = req.query; // lê os parâmetros da URL

    const sql = 'SELECT * FROM produtos';

    configDB.query(sql, (err, rows) => {
        if (err) {
            return res.render('formulario', {
                erro: 'Erro ao buscar produtos do banco.',
                produtos: []
            });
        }

        res.render('formulario', {
            sucesso,
            erro,
            produtos: rows
        });
    });
});

// Rota de cadastro
app.post('/cadastrar', (req, res) => {
    const { nome, valor } = req.body;

    if (!req.files || !req.files.imagem) {
        return res.redirect('/?erro=Imagem não foi enviada.');
    }

    const imagem = req.files.imagem;
    const uploadPath = path.join(__dirname, 'imagens', imagem.name);

    imagem.mv(uploadPath, (err) => {
        if (err) return res.redirect('/?erro=Erro ao salvar imagem.');

        let sql = 'INSERT INTO produtos (nome, valor, imagem) VALUES (?, ?, ?)';
        configDB.query(sql, [nome, valor, imagem.name], (err) => {
            if (err) return res.redirect('/?erro=Erro ao salvar no banco.');

            res.redirect('/?sucesso=Produto cadastrado com sucesso!');
        });
    });
});

//rota de remoção
app.get('/remover/:codigo/:imagem', function(req, res) {
    const { codigo, imagem } = req.params;

    const sql = 'DELETE FROM produtos WHERE codigo = ?';
    configDB.query(sql, [codigo], function(err, resultado) {
        if (err) {
            console.error('Erro ao remover do banco:', err);
            return res.redirect('/?erro=Erro ao remover produto.');
        }

        // Caminho da imagem com path.join (mais seguro)
        const caminhoImagem = path.join(__dirname, 'imagens', imagem);

        // Remove a imagem do disco
        fs.unlink(caminhoImagem, function(erroImagem) {
            if (erroImagem) {
                console.warn(' Falha ao remover a imagem:', erroImagem.message);
                return res.redirect('/?erro=Produto removido, mas não a imagem.');
            }

            console.log(' Produto e imagem removidos com sucesso');
            res.redirect('/?sucesso=Produto removido com sucesso!');
        });
    });
});


//rota de redirecionamento para formulario de alteração.

app.get('/formEdit/:codigo', function(req, res) {
    const codigo = req.params.codigo;

    configDB.query('SELECT * FROM produtos WHERE codigo = ?', [codigo], function(err, results) {
        if (err) {
            console.error("Erro ao buscar produto:", err);
            return res.redirect('/?erro=Erro ao buscar produto.');
        }

        if (results.length === 0) {
            return res.redirect('/?erro=Produto não encontrado.');
        }

        res.render('formEdit', { produto: results[0] });
    });
});

app.post('/editar', function(req, res){
//obter os dados do formulário

let nome = req.body.nome;
let valor = req.body.valor;
let codigo = req.body.codigo;
let nomeImagem = req.body.nomeImagem;
let imagem = req.files.imagem.name;

//exibir os dados

//finalizar a rota


})

app.listen(8080, () => {
    console.log('Servidor rodando em http://localhost:8080');
});
