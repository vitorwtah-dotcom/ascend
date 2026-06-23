const API = "http://localhost:3000"

async function cadastrarUsuario(event) {

    event.preventDefault();
    const nome = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("password").value;
    const confirmarSenha = document.getElementById("confirm_password").value;

    if (senha !== confirmarSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    const novoUsuario = { nome, email, senha, confirmarSenha };


    try {
        const resposta = await fetch(`${API}/usuarios`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(novoUsuario)
            });

        const dados = await resposta.json();
        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }
        localStorage.setItem("usuarioId", dados.id);
        alert("Usuário cadastrado com sucesso");
        window.location.href = "feed.html";
    }
    catch (erro) {
        console.log(erro);
    }
}

async function loginUsuario(event) {
    event.preventDefault();

    try {
        const email = document.getElementById("email_login").value;
        const senha = document.getElementById("password_login").value;

        const resposta = await fetch(`${API}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }

        localStorage.setItem("usuarioId", dados.id);
        localStorage.setItem("usuarioNome", dados.nome);

        alert("Login realizado com sucesso!");

        window.location.href = "feed.html";

    } catch (erro) {
        console.error(erro);
        alert("Erro ao conectar com o servidor.");
    }
}
async function carregarUsuarios() {
    const lista = document.getElementById("lista");

    if (!lista) return;
    try {
        const resposta = await fetch(`${API}/usuarios`);
        const usuarios = await resposta.json();
        lista.innerHTML = "";

        for (let usuario of usuarios) {
            lista.innerHTML += `
            <div class="usuario">
            <h2>${usuario.nome}</h2>
            <p>Email:${usuario.email}</p>
            <p>Status: ${usuario.ativo ? "Ativo" : "Inativo"}</p>
            <br>
            <button onclick="removerUsuario(${usuario.id})">Remover</button>
            <button onclick="atualizarStatus(${usuario.id})">Alterar</button>
            </div>
            `
        }
    } catch (erro) {
        console.log(erro)
    }
}

async function removerUsuario(id) {
    await fetch(`${API}/usuarios/${id}`, {
        method: "DELETE"
    })
    carregarUsuarios();
}

async function atualizarStatus(id) {
    await fetch(`${API}/usuarios/${id}`, {
        method: "PUT"
    })
    carregarUsuarios();
}


async function carragarEstatisticas() {
    const painel = document.getElementById("estatisticas")
    if (!painel) return;
    try {
        const resposta = await fetch(`${API}/usuarios`);
        const usuarios = await resposta.json();
        const totalUsuarios = usuarios.length;
        const ativos = usuarios.filter(usuario => usuario.ativo).length;
        const inativos = totalUsuarios - ativos;

        painel.innerHTML = `
        <div id="informacoes">
        <div class="card-stat">
        <h3 class="h3adm">Matriculas</h3>
        <p>Total: <strong>${totalUsuarios}</strong></p>
        <p>Alunos ativos: <strong>${ativos}</strong></p>
        <p>Alunos inativos: <strong>${inativos}</strong></p>
        </div>
        </div>
        `
    } catch (erro) {
        console.log("Erro ao carregar", erro)
        //mensagem de r=erro ao carregar 
    }
}

async function conferirAdm(event) {
    event.preventDefault();
    const senha = document.getElementById("senha").value;

    try {
        const resposta = await fetch(`${API}/admin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senha })
        });
        const dados = await resposta.json();
        if (!resposta.ok) {
            alert(dados.erro)
            return;
        }
        sessionStorage.setItem("admin_logado", "true");
        verificar();
    } catch (erro) {
        console.log("Erro na autenticação", erro)
    }
}

function verificar() {
    const login = document.getElementById("login")
    const conteudo = document.getElementById("conteudo");

    if (!login || !conteudo) return;
    if (sessionStorage.getItem("admin_logado") === "true") {
        login.style.display = "none";
        conteudo.style.display = "block"
        carragarEstatisticas();
    } else {
        login.style.display = "block";
        conteudo.style.display = "none"
    }
}

function logoutAdm() {
    sessionStorage.removeItem("admin_logado");
    window.location.reload();
}



const inputVideo = document.getElementById("video");
const videoPreview = document.getElementById("videoPreview");

if (inputVideo && videoPreview) {
    inputVideo.addEventListener("change", function () {
        const arquivo = inputVideo.files[0];

        if (!arquivo) return;

        const urlVideo = URL.createObjectURL(arquivo);

        videoPreview.src = urlVideo;
        videoPreview.load();
    });
}

async function carregarPerfil() {
    const elemento = document.getElementById("nomeUsuario");

    if (!elemento) return;

    const usuarioId = localStorage.getItem("usuarioId");

    if (!usuarioId) return;

    const resposta = await fetch(`${API}/usuarios/${usuarioId}`);
    const usuario = await resposta.json();

    elemento.innerHTML = usuario.nome;
}

const formPost = document.getElementById("formPost");

if (formPost) {
    formPost.addEventListener("submit", async function (event) {
        event.preventDefault();

        const dados = new FormData(formPost);

        const usuarioId = localStorage.getItem("usuarioId");

        dados.append("usuario_id", usuarioId);

        const resposta = await fetch("http://localhost:3000/upload-video", {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();

        alert(resultado.mensagem);

        window.location.href = "feed.html";
    });
};

const listaVideos = document.getElementById("videos");

async function carregarVideos() {
    if (!listaVideos) return;

    const resposta = await fetch("http://localhost:3000/videos");
    const videos = await resposta.json();

    listaVideos.innerHTML = "";

    videos.forEach(function(video) {
        const card = document.createElement("div");
        card.classList.add("video");

        card.innerHTML = `
            <a href="assistir.html?id=${video.id}">
            <img src="http://localhost:3000/${video.thumbnail}" width="300" height="200">
            </a>

        
            <style>
            h2{
            color:white;
            margin: 0;
            }
            p {
            color:white;
            margin: 0;
            }
            #div_text{
            display: flex;
            flex-direction: column;
            gap: -25px
            }
            </style>
            <div id="div_text">
            <h2>${video.titulo}</h2>
            <p>${video.descricao}</p>
            </div>
        `;

        listaVideos.appendChild(card);
    });
};

async function carregarVideo() {
    const tituloVideo = document.getElementById("tituloVideo");
    const descricaoVideo = document.getElementById("descricaoVideo");
    const player = document.getElementById("player");

    if (!tituloVideo || !descricaoVideo || !player) return;

    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");

    if (!id) return;

    const resposta = await fetch(`http://localhost:3000/videos/${id}`);
    const video = await resposta.json();

    tituloVideo.innerText = video.titulo;
    descricaoVideo.innerText = video.descricao;

    player.src = `http://localhost:3000/${video.video}`;
    player.load();
}

if (document.getElementById("player")) {
    carregarVideo();
}

carregarVideos();
carregarVideo();
carregarPerfil();
carragarEstatisticas();
carregarUsuarios();
verificar();
