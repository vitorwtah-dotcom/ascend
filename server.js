require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();

app.use(cors());
app.use(express.json());

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const db = mysql.createConnection(process.env.DATABASE_URL);

db.connect((erro) => {
    if (erro) {
        console.log("Erro ao conectar");
        console.log(erro);
        return;
    }
    console.log("Conectado com sucesso");

    db.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            senha VARCHAR(255) NOT NULL,
            ativo BOOLEAN DEFAULT TRUE,
            foto_perfil TEXT
        );
    `);

    db.query(`
        CREATE TABLE IF NOT EXISTS adm (
            id INT AUTO_INCREMENT PRIMARY KEY,
            senha VARCHAR(255) NOT NULL
        );
    `);

    db.query(`
        INSERT IGNORE INTO adm (id, senha)
        VALUES (1, '1234');
    `);

    db.query(`
        CREATE TABLE IF NOT EXISTS videos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(255),
            descricao TEXT,
            video TEXT,
            thumbnail TEXT,
            usuario_id INT,
            data_postagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        );
    `);

    db.query(`ALTER TABLE usuarios ADD COLUMN foto_perfil TEXT`, (erro) => {
        if (erro && erro.code !== "ER_DUP_FIELDNAME") {
            console.log("Erro foto_perfil:", erro.sqlMessage);
        }
    });

    db.query(`ALTER TABLE usuarios ADD COLUMN banner TEXT`, (erro) => {
        if (erro && erro.code !== "ER_DUP_FIELDNAME") {
            console.log("Erro banner:", erro.sqlMessage);
        }
    });

    db.query(`ALTER TABLE usuarios ADD COLUMN bio TEXT`, (erro) => {
        if (erro && erro.code !== "ER_DUP_FIELDNAME") {
            console.log("Erro bio:", erro.sqlMessage);
        }
    });

    db.query(`ALTER TABLE videos ADD COLUMN visualizacoes INT DEFAULT 0`, (erro) => {
        if (erro && erro.code !== "ER_DUP_FIELDNAME") {
            console.log("Erro visualizacoes:", erro.sqlMessage);
        }
    });

    db.query(`
    CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        video_id INT NOT NULL,
        UNIQUE KEY like_unico (usuario_id, video_id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (video_id) REFERENCES videos(id)
    );
`);

    db.query(`
    CREATE TABLE IF NOT EXISTS inscritos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inscrito_id INT NOT NULL,
        canal_id INT NOT NULL,
        UNIQUE KEY inscricao_unica (inscrito_id, canal_id),
        FOREIGN KEY (inscrito_id) REFERENCES usuarios(id),
        FOREIGN KEY (canal_id) REFERENCES usuarios(id)
    );
`);
});

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

    db.query(
        "DELETE FROM likes WHERE usuario_id = ?",
        [id],
        (erro) => {

            if (erro) {
                return res.status(500).json({ erro: erro.sqlMessage });
            }

            db.query(
                "DELETE FROM inscritos WHERE inscrito_id = ? OR canal_id = ?",
                [id, id],
                (erro) => {

                    if (erro) {
                        return res.status(500).json({ erro: erro.sqlMessage });
                    }

                    db.query(
                        "DELETE FROM likes WHERE video_id IN (SELECT id FROM videos WHERE usuario_id = ?)",
                        [id],
                        (erro) => {

                            if (erro) {
                                return res.status(500).json({ erro: erro.sqlMessage });
                            }

                            db.query(
                                "DELETE FROM videos WHERE usuario_id = ?",
                                [id],
                                (erro) => {

                                    if (erro) {
                                        return res.status(500).json({ erro: erro.sqlMessage });
                                    }

                                    db.query(
                                        "DELETE FROM usuarios WHERE id = ?",
                                        [id],
                                        (erro, resultado) => {

                                            if (erro) {
                                                return res.status(500).json({ erro: erro.sqlMessage });
                                            }

                                            if (resultado.affectedRows === 0) {
                                                return res.status(404).json({
                                                    erro: "Usuário não encontrado!"
                                                });
                                            }

                                            res.json({
                                                mensagem: "Usuário removido com sucesso!"
                                            });

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

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
        "SELECT nome, email, foto_perfil, banner, bio FROM usuarios WHERE id = ?",
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

const upload = multer({ dest: "temp/" });

app.post("/upload-video", upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
]), async function (req, res) {

    try {
        const titulo = req.body.titulo;
        const descricao = req.body.descricao;
        const usuario_id = req.body.usuario_id;

        if (!req.files.video || !req.files.thumbnail) {
            return res.status(400).json({
                mensagem: "Envie o vídeo e a thumbnail."
            });
        }

        const uploadVideo = await cloudinary.uploader.upload(req.files.video[0].path, {
            resource_type: "video",
            folder: "ascend/videos"
        });

        if (uploadVideo.height > uploadVideo.width) {

            await cloudinary.uploader.destroy(uploadVideo.public_id, {
                resource_type: "video"
            });

            return res.status(400).json({
                mensagem: "Só é permitido enviar vídeos horizontais."
            });
        }

        const uploadThumbnail = await cloudinary.uploader.upload(req.files.thumbnail[0].path, {
            resource_type: "image",
            folder: "ascend/thumbnails"
        });

        const video = uploadVideo.secure_url;
        const thumbnail = uploadThumbnail.secure_url;

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

    } catch (erro) {
        console.log(erro);
        res.status(500).json({
            mensagem: "Erro ao enviar vídeo para a nuvem"
        });
    }
});

app.get("/videos", function (req, res) {
    const sql = `
    SELECT 
        videos.*,
        usuarios.nome AS usuario,
        usuarios.foto_perfil,
        usuarios.banner
    FROM videos
    INNER JOIN usuarios
    ON videos.usuario_id = usuarios.id
    ORDER BY videos.data_postagem DESC
    `;

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
    const usuarioLogadoId = req.query.usuario;

    const sql = `
        SELECT 
            videos.*,
            usuarios.id AS usuario_id,
            usuarios.nome AS usuario,
            usuarios.foto_perfil,
            usuarios.banner,
            usuarios.bio,

            COUNT(DISTINCT likes.id) AS total_likes,

            EXISTS(
                SELECT 1
                FROM likes l
                WHERE l.video_id = videos.id
                AND l.usuario_id = ?
            ) AS usuario_curtiu,

            (
                SELECT COUNT(*)
                FROM inscritos i
                WHERE i.canal_id = usuarios.id
            ) AS total_inscritos,

            EXISTS(
                SELECT 1
                FROM inscritos i2
                WHERE i2.canal_id = usuarios.id
                AND i2.inscrito_id = ?
            ) AS usuario_inscrito

        FROM videos

        INNER JOIN usuarios
        ON videos.usuario_id = usuarios.id

        LEFT JOIN likes
        ON likes.video_id = videos.id

        WHERE videos.id = ?

        GROUP BY videos.id
    `;

    db.query(sql, [usuarioLogadoId, usuarioLogadoId, id], function (erro, resultado) {
        if (erro) {
            return res.status(500).json({
                mensagem: "Erro ao buscar vídeo",
                erro: erro.sqlMessage
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

app.put("/perfil/:id", upload.fields([
    { name: "foto_perfil", maxCount: 1 },
    { name: "banner", maxCount: 1 }
]), async function (req, res) {
    try {
        const { id } = req.params;
        const { bio } = req.body;

        let fotoPerfilUrl = null;
        let bannerUrl = null;

        if (req.files && req.files.foto_perfil) {
            const uploadFoto = await cloudinary.uploader.upload(req.files.foto_perfil[0].path, {
                resource_type: "image",
                folder: "ascend/perfis"
            });

            fotoPerfilUrl = uploadFoto.secure_url;
        }

        if (req.files && req.files.banner) {
            const uploadBanner = await cloudinary.uploader.upload(req.files.banner[0].path, {
                resource_type: "image",
                folder: "ascend/banners"
            });

            bannerUrl = uploadBanner.secure_url;
        }

        const sql = `
            UPDATE usuarios
            SET
                bio = COALESCE(?, bio),
                foto_perfil = COALESCE(?, foto_perfil),
                banner = COALESCE(?, banner)
            WHERE id = ?
        `;

        db.query(sql, [bio || null, fotoPerfilUrl, bannerUrl, id], function (erro) {
            if (erro) {
                console.log(erro);
                return res.status(500).json({ mensagem: "Erro ao atualizar perfil" });
            }

            res.json({ mensagem: "Perfil atualizado com sucesso!" });
        });

    } catch (erro) {
        console.log(erro);
        res.status(500).json({ mensagem: "Erro ao enviar imagens para o Cloudinary" });
    }
});

app.get("/pesquisa", (req, res) => {
    const termo = `%${req.query.q}%`;

    const sqlUsuarios = `
        SELECT id, nome, foto_perfil
        FROM usuarios
        WHERE nome LIKE ?
    `;

    const sqlVideos = `
        SELECT 
            videos.id,
            videos.titulo,
            videos.thumbnail,
            usuarios.nome
        FROM videos
        INNER JOIN usuarios
        ON videos.usuario_id = usuarios.id
        WHERE videos.titulo LIKE ? OR videos.descricao LIKE ?
    `;

    db.query(sqlUsuarios, [termo], (erro, usuarios) => {
        if (erro) {
            return res.status(500).json({ erro: erro.sqlMessage });
        }

        db.query(sqlVideos, [termo, termo], (erro, videos) => {
            if (erro) {
                return res.status(500).json({ erro: erro.sqlMessage });
            }

            res.json({ usuarios, videos });
        });
    });
});

app.post("/videos/:id/like", (req, res) => {
    const video_id = req.params.id;
    const { usuario_id } = req.body;

    if (!usuario_id) {
        return res.status(400).json({
            mensagem: "Usuário não informado"
        });
    }

    const sqlVerificar = `
        SELECT * FROM likes
        WHERE usuario_id = ? AND video_id = ?
    `;

    db.query(sqlVerificar, [usuario_id, video_id], (erro, resultado) => {
        if (erro) {
            return res.status(500).json({ erro: erro.sqlMessage });
        }

        if (resultado.length > 0) {
            db.query(
                "DELETE FROM likes WHERE usuario_id = ? AND video_id = ?",
                [usuario_id, video_id],
                (erro) => {
                    if (erro) {
                        return res.status(500).json({ erro: erro.sqlMessage });
                    }

                    res.json({ curtido: false });
                }
            );
        } else {
            db.query(
                "INSERT INTO likes (usuario_id, video_id) VALUES (?, ?)",
                [usuario_id, video_id],
                (erro) => {
                    if (erro) {
                        return res.status(500).json({ erro: erro.sqlMessage });
                    }

                    res.json({ curtido: true });
                }
            );
        }
    });
});

app.post("/videos/:id/view", (req, res) => {

    const id = req.params.id;

    db.query(
        "UPDATE videos SET visualizacoes = visualizacoes + 1 WHERE id = ?",
        [id],
        function (erro) {

            if (erro) {
                return res.status(500).json(erro);
            }

            res.json({
                mensagem: "Visualização registrada"
            });

        }
    );

});

app.post("/usuarios/:id/inscrever", (req, res) => {
    const canal_id = req.params.id;
    const { inscrito_id } = req.body;

    if (!inscrito_id) {
        return res.status(400).json({
            mensagem: "Usuário não informado"
        });
    }

    if (Number(inscrito_id) === Number(canal_id)) {
        return res.status(400).json({
            mensagem: "Você não pode se inscrever em si mesmo"
        });
    }

    const sqlVerificar = `
        SELECT * FROM inscritos
        WHERE inscrito_id = ? AND canal_id = ?
    `;

    db.query(sqlVerificar, [inscrito_id, canal_id], (erro, resultado) => {
        if (erro) {
            return res.status(500).json({ erro: erro.sqlMessage });
        }

        if (resultado.length > 0) {
            db.query(
                "DELETE FROM inscritos WHERE inscrito_id = ? AND canal_id = ?",
                [inscrito_id, canal_id],
                (erro) => {
                    if (erro) {
                        return res.status(500).json({ erro: erro.sqlMessage });
                    }

                    res.json({ inscrito: false });
                }
            );
        } else {
            db.query(
                "INSERT INTO inscritos (inscrito_id, canal_id) VALUES (?, ?)",
                [inscrito_id, canal_id],
                (erro) => {
                    if (erro) {
                        return res.status(500).json({ erro: erro.sqlMessage });
                    }

                    res.json({ inscrito: true });
                }
            );
        }
    });
});

app.get("/usuarios/:id/estatisticas", (req, res) => {

    const canalId = req.params.id;
    const usuarioLogado = req.query.usuario;

    const sql = `
        SELECT

        (SELECT COUNT(*)
         FROM inscritos
         WHERE canal_id = ?) AS total_inscritos,

        (SELECT COUNT(*)
         FROM videos
         WHERE usuario_id = ?) AS total_videos,

        EXISTS(
            SELECT 1
            FROM inscritos
            WHERE canal_id = ?
            AND inscrito_id = ?
        ) AS usuario_inscrito
    `;

    db.query(
        sql,
        [canalId, canalId, canalId, usuarioLogado],
        (erro, resultado) => {

            if (erro) {
                return res.status(500).json({
                    erro: erro.sqlMessage
                });
            }

            res.json(resultado[0]);
        }
    );

});

app.get("/usuarios/:id/videos", (req, res) => {

    const id = req.params.id;

    const sql = `
        SELECT
            videos.*,
            usuarios.nome,
            usuarios.foto_perfil

        FROM videos

        INNER JOIN usuarios
        ON videos.usuario_id = usuarios.id

        WHERE usuario_id = ?

        ORDER BY data_postagem DESC
    `;

    db.query(sql, [id], (erro, resultado) => {

        if (erro) {
            return res.status(500).json({
                erro: erro.sqlMessage
            });
        }

        res.json(resultado);

    });

});

app.delete("/videos/:id", (req, res) => {

    const id = req.params.id;
    const { usuario_id } = req.body;

    db.query(
        "DELETE FROM likes WHERE video_id = ?",
        [id],
        (erro) => {

            if (erro) {
                return res.status(500).json({
                    erro: erro.sqlMessage
                });
            }
            db.query(
                `
                DELETE FROM videos
                WHERE id = ?
                AND usuario_id = ?
                `,
                [id, usuario_id],
                (erro, resultado) => {

                    if (erro) {
                        return res.status(500).json({
                            erro: erro.sqlMessage
                        });
                    }

                    if (resultado.affectedRows === 0) {
                        return res.status(404).json({
                            mensagem: "Vídeo não encontrado."
                        });
                    }

                    res.json({
                        mensagem: "Vídeo removido com sucesso!"
                    });

                }
            );

        }
    );

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});