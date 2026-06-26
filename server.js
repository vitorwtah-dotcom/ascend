const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "Ascend"
});

db.connect((erro) => {
    if (erro) {
        console.log("Erro ao conectar");
        console.log(erro);
        return;
    }
    console.log("Conectado com sucesso");
})

let i = 1

app.get("/", (req, res) => {
    res.json({
        mensagem: "API funcionando"
    })
})

app.post("/usuarios", (req, res) => {
    const {
        nome, email, senha, confirmarSenha
    } = req.body


    if (senha !== confirmarSenha) {
        return res.status(400).json({
            erro: "As senhas não coincidem"
        });
    }

    if (!nome || !email || !senha || !confirmarSenha) {
        return res.status(400).json({
            erro: "Preencha todos os campos."
        })
    }

    const verificaSQL = "SELECT * FROM usuarios WHERE email = ?";
    db.query(verificaSQL, [email],
        (erro, resultado) => {
            if (erro) {
                return res.status(500).json({
                    erro: erro.sqlMessage
                });
            }
            if (resultado.length > 0) {
                return res.status(400).json({
                    erro: "Já existe esse email cadastrado! "
                })
            }
            const inserirSQL = `INSERT INTO usuarios (nome, email, senha)
            VALUES (?,?,?)`
            db.query(
                inserirSQL,
                [nome, email, senha],
                (erro, resultado) => {
                    if (erro) {
                        return res.status(500).json({
                            erro: erro.sqlMessage
                        });
                    }
                    res.status(201).json({
                        mensagem: "Usuário cadastrado!",
                        id: resultado.insertId
                    });
                }
            );
        }
    )
    i++;
});

app.get("/usuarios", (req, res) => {
    db.query(
        "SELECT * FROM usuarios", (erro, resultado) => {
            if (erro) {
                return res.status(500).json({
                    erro: erro.sqlMessage
                });
            }
            res.json(resultado)
        }
    )
})

app.delete("/usuarios/:id", (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM usuarios WHERE id = ?",
        [id], (erro, resultado) => {
            if (erro) {
                return res.status(500).json({
                    erro: erro.sqlMessage
                });
            } if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Usuário não encontrado!"
                });
            }
            res.json({
                mensagem: "Usuário removido!"
            });
        });
});


app.put("/usuarios/:id", (req, res) => {
    const id = req.params.id;
    db.query("SELECT ativo FROM usuarios WHERE id = ?", [id], (erro, resultado) => {
        if (erro) {
            return res.status(500).json({
                erro: erro.sqlMessage
            });
        }
        if (resultado.length === 0) {
            return res.status(404).json({
                erro: "Usuário não encontrado!"
            })
        }
        const novoStatus =
            resultado[0].ativo ? 0 : 1;

        db.query("UPDATE usuarios SET ativo = ? WHERE id = ?", [novoStatus, id], (erro) => {
            if (erro) {
                return res.status(500).json({
                    erro: erro.sqlMessage
                });
            }
            res.json({
                mensagem: "Usuário atualizado!"
            });
        });
    });
});

app.post("/admin", (req, res) => {
    const { senha } = req.body;

    if (!senha) {
        return res.status(400).json({
            erro: "Informe uma senha!"
        });
    }

    const sql = "SELECT senha FROM adm LIMIT 1";

    db.query(sql, (erro, resultado) => {

        if (erro) {
            return res.status(500).json({
                erro: erro.sqlMessage
            });
        }

        const senhaBanco = resultado[0].senha;

        if (senha === senhaBanco) {
            return res.json({
                autenticado: true
            });
        }

        return res.status(401).json({
            erro: "Senha incorreta."
        });

    });
});

app.get("/usuarios/:id", (req, res) => {
    const { id } = req.params;

    db.query(
        "SELECT nome FROM usuarios WHERE id = ?",
        [id],
        (erro, resultado) => {
            if (erro) {
                return res.status(500).json({
                    erro: erro.sqlMessage
                });
            }

            if (resultado.length === 0) {
                return res.status(404).json({
                    mensagem: "Usuário não encontrado"
                });
            }

            res.json(resultado[0]);
        }
    );
});

app.post("/login", (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            erro: "Preencha email e senha"
        });
    }

    db.query(
        "SELECT * FROM usuarios WHERE email = ?",
        [email],
        (erro, resultado) => {
            if (erro) {
                return res.status(500).json({
                    erro: erro.sqlMessage
                });
            }

            if (resultado.length === 0) {
                return res.status(401).json({
                    erro: "Email não encontrado"
                });
            }

            const usuario = resultado[0];

            if (usuario.senha !== senha) {
                return res.status(401).json({
                    erro: "Senha incorreta"
                });
            }

            res.json({
                mensagem: "Login realizado",
                id: usuario.id,
                nome: usuario.nome
            });
        }
    );
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === "video") {
            cb(null, "uploads/videos/");
        } else if (file.fieldname === "thumbnail") {
            cb(null, "uploads/thumbs/");
        }
    },

    filename: function (req, file, cb) {
        const nomeArquivo = Date.now() + path.extname(file.originalname);
        cb(null, nomeArquivo);
    }
});

const upload = multer({ storage: storage });

app.post("/upload-video", upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
]), function (req, res) {

    const titulo = req.body.titulo;
    const descricao = req.body.descricao;
    const usuario_id = req.body.usuario_id;

    const video = "uploads/videos/" + req.files.video[0].filename;
    const thumbnail = "uploads/thumbs/" + req.files.thumbnail[0].filename;

    const sql = `
        INSERT INTO videos (titulo, descricao, video, thumbnail, usuario_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [titulo, descricao, video, thumbnail, usuario_id], function (erro) {
        if (erro) {
            console.log(erro);
            return res.status(500).json({
                mensagem: "Erro ao salvar vídeo no banco"
            });
        }

        res.json({
            mensagem: "Vídeo postado com sucesso!"
        });
    });
});

app.get("/videos", function (req, res) {
    const sql = `
    SELECT videos.*,
    usuarios.nome AS usuario
    FROM videos
    INNER JOIN usuarios
    ON videos.usuario_id = usuarios.id
    ORDER BY videos.data_postagem DESC
`;;

    db.query(sql, function (erro, resultados) {
        if (erro) {
            return res.status(500).json({
                mensagem: "Erro ao buscar vídeos"
            });
        }

        res.json(resultados);
    });
});

app.get("/videos/:id", function (req, res) {
    const id = req.params.id;

    const sql = `
        SELECT videos.*,
        usuarios.nome AS usuario
        FROM videos
        INNER JOIN usuarios
        ON videos.usuario_id = usuarios.id
        WHERE videos.id = ?
        `;

    db.query(sql, [id], function (erro, resultado) {
        if (erro) {
            return res.status(500).json({
                mensagem: "Erro ao buscar vídeo"
            });
        }

        if (resultado.length === 0) {
            return res.status(404).json({
                mensagem: "Vídeo não encontrado"
            });
        }

        res.json(resultado[0]);
    });
});

app.listen(3000, () => {
    console.log("Servidor rodando em: ")
    console.log("http://localhost:3000")
});
