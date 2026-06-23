
async function gerarMensagem() {

    try {

        const resposta = await fetch(
            "https://api.adviceslip.com/advice"
        );

        const dados = await resposta.json();

        document.getElementById("mensagem").value =
            dados.slip.advice;

    } catch (erro) {

        console.log("Erro:", erro);

    }
}