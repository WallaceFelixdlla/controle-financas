const email = document.getElementById("email");
const senha = document.getElementById("senha");
const mensagem = document.getElementById("mensagem");

document.getElementById("btn-cadastro").addEventListener("click", async () => {

    mensagem.textContent = "";

    const { error } = await window.supabaseClient.auth.signUp({
        email: email.value.trim(),
        password: senha.value
    });

    if (error) {
        mensagem.style.color = "red";
        mensagem.textContent = error.message;
        return;
    }

    mensagem.style.color = "green";
    mensagem.textContent = "Conta criada com sucesso!";
});

document.getElementById("btn-login").addEventListener("click", async () => {

    mensagem.textContent = "";

    const { error } = await window.supabaseClient.auth.signInWithPassword({
        email: email.value.trim(),
        password: senha.value
    });

    if (error) {
        mensagem.style.color = "red";
        mensagem.textContent = "E-mail ou senha inválidos.";
        return;
    }

    window.location.href = "index.html";

});