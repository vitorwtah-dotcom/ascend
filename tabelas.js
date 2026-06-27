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
db.query(`
INSERT IGNORE INTO adm (id, senha)
VALUES (1, '1234');
`);