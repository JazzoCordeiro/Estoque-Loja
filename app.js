import express from 'express';
import mysql from 'mysql2';
import { engine } from 'express-handlebars';
import fileupload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
    const { sucesso, erro } = req.query;

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
    const { nome, valor, quantidade } = req.body;

    if (!req.files || !req.files.imagem) {
        return res.redirect('/?erro=Imagem não foi enviada.');
    }

    const imagem = req.files.imagem;
    const nomeImagemUnico = `${Date.now()}_${imagem.name}`;
    const uploadPath = path.join(__dirname, 'imagens', nomeImagemUnico);

    imagem.mv(uploadPath, (err) => {
        if (err) return res.redirect('/?erro=Erro ao salvar imagem.');

        const sql = 'INSERT INTO produtos (nome, valor, imagem, quantidade) VALUES (?, ?, ?, ?)';
        configDB.query(sql, [nome, valor, nomeImagemUnico, quantidade], (err) => {
            if (err) return res.redirect('/?erro=Erro ao salvar no banco.');
            res.redirect('/?sucesso=Produto cadastrado com sucesso!');
        });
    });
});

// Rota de remoção
app.get('/remover/:codigo/:imagem', (req, res) => {
    const { codigo, imagem } = req.params;

    const sql = 'DELETE FROM produtos WHERE codigo = ?';
    configDB.query(sql, [codigo], (err) => {
        if (err) {
            console.error('Erro ao remover do banco:', err);
            return res.redirect('/?erro=Erro ao remover produto.');
        }

        const caminhoImagem = path.join(__dirname, 'imagens', imagem);
        fs.unlink(caminhoImagem, (erroImagem) => {
            if (erroImagem) {
                console.warn('Falha ao remover a imagem:', erroImagem.message);
                return res.redirect('/?erro=Produto removido, mas não a imagem.');
            }

            console.log('Produto e imagem removidos com sucesso');
            res.redirect('/?sucesso=Produto removido com sucesso!');
        });
    });
});

// Formulário de edição
app.get('/formEdit/:codigo', (req, res) => {
    const codigo = req.params.codigo;

    configDB.query('SELECT * FROM produtos WHERE codigo = ?', [codigo], (err, results) => {
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

// Edição
app.post('/editar', (req, res) => {
    const { nome, valor, codigo, nomeImagem, quantidade } = req.body;

    if (req.files && req.files.imagem) {
        const novaImagem = req.files.imagem;
        const nomeImagemUnico = `${Date.now()}_${novaImagem.name}`;
        const caminhoNovaImagem = path.join(__dirname, 'imagens', nomeImagemUnico);
        const caminhoImagemAntiga = path.join(__dirname, 'imagens', nomeImagem);

        fs.unlink(caminhoImagemAntiga, (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Erro ao apagar imagem antiga:', err);
                return res.redirect('/?erro=Erro ao apagar imagem antiga.');
            }

            novaImagem.mv(caminhoNovaImagem, (err) => {
                if (err) {
                    console.error('Erro ao salvar nova imagem:', err);
                    return res.redirect('/?erro=Erro ao salvar nova imagem.');
                }

                const sql = `UPDATE produtos SET nome = ?, valor = ?, imagem = ?, quantidade = ? WHERE codigo = ?`;
                configDB.query(sql, [nome, parseFloat(valor), nomeImagemUnico, parseInt(quantidade), parseInt(codigo)], (err) => {
                    if (err) {
                        console.error('Erro ao atualizar no banco:', err);
                        return res.redirect('/?erro=Erro ao atualizar produto.');
                    }

                    return res.redirect('/?sucesso=Produto atualizado com nova imagem!');
                });
            });
        });
    } else {
        const sql = `UPDATE produtos SET nome = ?, valor = ?, quantidade = ? WHERE codigo = ?`;
        configDB.query(sql, [nome, parseFloat(valor), parseInt(quantidade), parseInt(codigo)], (err) => {
            if (err) {
                console.error('Erro ao atualizar produto:', err);
                return res.redirect('/?erro=Erro ao atualizar produto.');
            }

            return res.redirect('/?sucesso=Produto atualizado (imagem mantida)!');
        });
    }
});

// Inicia o servidor
app.listen(8080, () => {
    console.log('Servidor rodando em http://localhost:8080');
});
