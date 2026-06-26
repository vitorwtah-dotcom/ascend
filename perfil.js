const usuarioId = localStorage.getItem("usuarioId");

if (!usuarioId) {
    window.location.replace("cadastro.html");
}