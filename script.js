const API = "https://ascend-backend-r53o.onrender.com"

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
            console.log(dados);
            alert(dados.erro || dados.sqlMessage || dados.message || JSON.stringify(dados));
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

const FOTO_PADRAO = "https://res.cloudinary.com/dyglfqcks/image/upload/v1782598822/fotoPadrao_g2aakv.png";
const BANNER_PADRAO = "https://res.cloudinary.com/dyglfqcks/image/upload/v1782598823/bannerPadrao_dgzvir.png";

async function carregarPerfil() {

    const parametros = new URLSearchParams(window.location.search);
    const idPerfil = parametros.get("id");

    const usuarioId = idPerfil || localStorage.getItem("usuarioId");

    if (!usuarioId) return;

    const resposta = await fetch(`${API}/usuarios/${usuarioId}`);
    const usuario = await resposta.json();

    const nomeUsuario = document.getElementById("nomeUsuario");
    const fotoPerfil = document.getElementById("fotoPerfil");
    const iconeHeader = document.getElementById("icone");
    const bannerPerfil = document.getElementById("bannerPerfil");
    const bioPerfil = document.getElementById("bioPerfil");

    if (nomeUsuario)
        nomeUsuario.innerHTML = usuario.nome;
    if (fotoPerfil)
        fotoPerfil.src = usuario.foto_perfil || FOTO_PADRAO;
    if (iconeHeader)
        iconeHeader.src = usuario.foto_perfil || FOTO_PADRAO;
    if (bannerPerfil)
        bannerPerfil.src = usuario.banner || BANNER_PADRAO;
    if (bioPerfil)
        bioPerfil.innerHTML = usuario.bio || "Sem bio ainda.";

    const botaoEditar = document.getElementById("botaoEditar");

    if (botaoEditar) {
        if (idPerfil && idPerfil !== localStorage.getItem("usuarioId")) {
            botaoEditar.style.display = "none";
        }
    }

    const botaoSair = document.getElementById("botaoSair");

    if (botaoSair) {
        if (idPerfil && idPerfil !== localStorage.getItem("usuarioId")) {
            botaoSair.style.display = "none";
        }
    }
    

}

const formPost = document.getElementById("formPost");

if (formPost) {
    formPost.addEventListener("submit", async function (event) {
        event.preventDefault();

        const dados = new FormData(formPost);

        const usuarioId = localStorage.getItem("usuarioId");

        dados.append("usuario_id", usuarioId);

        const resposta = await fetch(`${API}/upload-video`, {
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

    const resposta = await fetch(`${API}/videos`);
    const videos = await resposta.json();

    listaVideos.innerHTML = "";

    videos.forEach(function (video) {
        const card = document.createElement("div");
        card.classList.add("video");

        card.innerHTML = `

            <div class="videoParente">
            <a href="assistir.html?id=${video.id}">
                <img class="video-thumbnail" src="${video.thumbnail}" width="300" height="200">
            </a>

            <div id="informations">
            <div>
            <img src="${video.foto_perfil || FOTO_PADRAO}" width="40" height="40"  class="fotoPerfilFeed">
            </div>
            <div id="divisao">
            <h2>${video.titulo}</h2>
            <p>${video.usuario}</p>
            </div>
            </div>
            </div>
        `;

        listaVideos.appendChild(card);
    });
};


async function carregarVideo() {

    const tituloVideo = document.getElementById("tituloVideo");
    const descricaoVideo = document.getElementById("descricaoVideo");
    const player = document.getElementById("player");
    const usuarioVideo = document.getElementById("usuarioVideo");
    const fotoAutor = document.getElementById("fotoAutor");
    const dataVideo = document.getElementById("dataVideo");

    if (
        !tituloVideo ||
        !descricaoVideo ||
        !player ||
        !usuarioVideo ||
        !fotoAutor ||
        !dataVideo
    ) return;

    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");

    if (!id) return;

    const resposta = await fetch(`${API}/videos/${id}`);
    const video = await resposta.json();

    tituloVideo.innerText = video.titulo;
    descricaoVideo.innerText = video.descricao;
    usuarioVideo.innerText = video.usuario;

    fotoAutor.src =
        video.foto_perfil || FOTO_PADRAO;

    const data = new Date(video.data_postagem);

    dataVideo.innerText =
        "Publicado em " +
        data.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

    player.src = video.video;
    player.load();

}
if (document.getElementById("player")) {
    carregarVideo();
}


function deslogConta() {
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("usuarioNome");
    sessionStorage.clear();

    window.location.replace("cadastro.html");
}

function verificarLogin() {
    const paginasProtegidas = [
        "feed.html",
        "perfil.html",
        "adm.html",
        "postar.html",
        "assistir.html"
    ];

    const paginaAtual = window.location.pathname.split("/").pop();

    if (
        paginasProtegidas.includes(paginaAtual) &&
        !localStorage.getItem("usuarioId")
    ) {
        window.location.replace("cadastro.html");
    }
}

window.addEventListener("pageshow", function () {
    verificarLogin();
});

const formPerfil = document.getElementById("formPerfil");

if (formPerfil) {
    formPerfil.addEventListener("submit", async function (event) {
        event.preventDefault();

        try {
            const usuarioId = localStorage.getItem("usuarioId");

            if (!usuarioId) {
                alert("Usuário não está logado.");
                return;
            }

            const dados = new FormData(formPerfil);

            const resposta = await fetch(`${API}/perfil/${usuarioId}`, {
                method: "PUT",
                body: dados
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                alert(resultado.mensagem || "Erro ao atualizar perfil.");
                return;
            }

            alert(resultado.mensagem);
            fecharModal();
            carregarPerfil();

        } catch (erro) {
            console.log("Erro ao salvar perfil:", erro);
            alert("Erro ao conectar com o servidor.");
        }
    });
};

function abrirModal() {

    document.getElementById("modalPerfil").style.display = "flex";

}

function fecharModal() {

    document.getElementById("modalPerfil").style.display = "none";

}

async function pesquisarModal() {
    const input = document.getElementById("inputPesquisa");
    const modal = document.getElementById("modalPesquisa");

    if (!input || !modal) return;

    const termo = input.value.trim();

    if (termo.length === 0) {
        modal.style.display = "none";
        modal.innerHTML = "";
        return;
    }

    try {
        const resposta = await fetch(`${API}/pesquisa?q=${encodeURIComponent(termo)}`);
        const dados = await resposta.json();

        console.log("Resultado da pesquisa:", dados);

        modal.innerHTML = "";
        modal.style.display = "block";

        if (dados.usuarios.length === 0 && dados.videos.length === 0) {
            modal.innerHTML = "<p>Nenhum resultado encontrado.</p>";
            return;
        }

        modal.innerHTML += `<h3>Perfis</h3>`;

        dados.usuarios.forEach(usuario => {
            modal.innerHTML += `
                <div class="resultadoItem" onclick="abrirPerfilPesquisa(${usuario.id})">
                    <img src="${usuario.foto_perfil || FOTO_PADRAO}">
                    <div>
                        <strong>${usuario.nome}</strong>
                        <p>Ver perfil</p>
                    </div>
                </div>
            `;
        });

        modal.innerHTML += `<h3>Vídeos</h3>`;

        dados.videos.forEach(video => {
            modal.innerHTML += `
                <div class="resultadoItem" onclick="abrirVideoPesquisa(${video.id})">
                    <img src="${video.thumbnail}" width="100" height="60">
                    <div>
                        <strong>${video.titulo}</strong>
                        <p>${video.nome}</p>
                    </div>
                </div>
            `;
        });

    } catch (erro) {
        console.log("Erro na pesquisa:", erro);
        modal.style.display = "block";
        modal.innerHTML = "<p>Erro ao pesquisar.</p>";
    }
}

function abrirPerfilPesquisa(id) {
    window.location.href = `perfil.html?id=${id}`;
}

function abrirVideoPesquisa(id) {
    window.location.href = `assistir.html?id=${id}`;
}

carregarVideos();
carregarVideo();
carregarPerfil();
carragarEstatisticas();
carregarUsuarios();
verificar();
