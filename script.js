const API_URL = "http://localhost:8000/livros";
const resultados = document.getElementById("resultadosBusca");
const formAdicionar = document.getElementById("formAdicionar");
const campoBusca = document.getElementById("campoBusca");

let todosOsLivros = []; 

// 1. LER LIVROS (GET) 
async function buscarLivrosDaAPI() {
    try {
        const resposta = await fetch(API_URL);
        
        if (resposta.ok) { 
            const json = await resposta.json();
            todosOsLivros = json.dados; 
            exibirLivros(todosOsLivros);
        } else {
            resultados.innerHTML = "<p>Erro: O servidor respondeu, mas não encontrou os dados.</p>";
        }
    } catch (erro) {
        console.error("Erro de conexão. O Python (FastAPI) está rodando?", erro);
        resultados.innerHTML = "<p>Erro de conexão. Verifique se o Back-end está ligado.</p>";
    }
}

// 2. EXIBIR LIVROS NA TELA
function exibirLivros(lista) {
    resultados.innerHTML = ""; 
    const grid = document.createElement("div");
    grid.classList.add("grid-livros");

    lista.forEach(livro => {
        const card = document.createElement("div");
        card.classList.add("card-livro");

        const img = document.createElement("img");
        img.src = livro.url_imagem;
        
        const titulo = document.createElement("h3");
        titulo.textContent = livro.titulo;

        const autor = document.createElement("p");
        autor.textContent = `Autor: ${livro.autor}`;

        const status = document.createElement("p");
        status.textContent = livro.disponivel ? "Disponível" : "Indisponível";
        status.style.color = livro.disponivel ? "green" : "red";
        status.style.fontWeight = "bold";

        const btnReservar = document.createElement("button");
        btnReservar.textContent = livro.disponivel ? "Reservar" : "Devolver";
        btnReservar.classList.add(livro.disponivel ? "btn-reservar" : "btn-devolver");
        btnReservar.onclick = () => atualizarStatus(livro);

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.classList.add("btn-excluir");
        btnExcluir.onclick = () => deletarLivro(livro.id);

        const divBotoes = document.createElement("div");
        divBotoes.classList.add("botoes-card");
        divBotoes.append(btnReservar, btnExcluir);

        card.append(img, titulo, autor, status, divBotoes);
        grid.appendChild(card);
    });

    resultados.appendChild(grid);
}

// 3. BARRA DE PESQUISA
campoBusca.addEventListener("input", (evento) => {
    const termo = evento.target.value.toLowerCase();
    const livrosFiltrados = todosOsLivros.filter(livro => 
        livro.titulo.toLowerCase().includes(termo) || 
        livro.autor.toLowerCase().includes(termo)
    );
    exibirLivros(livrosFiltrados);
});

// 4. ADICIONAR NOVO LIVRO (POST)
formAdicionar.addEventListener("submit", async (evento) => {
    evento.preventDefault(); 
    
    const novoLivro = {
        titulo: document.getElementById("inputTitulo").value,
        autor: document.getElementById("inputAutor").value,
        url_imagem: document.getElementById("inputImagem").value,
        disponivel: true
    };

    try {
        const resposta = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(novoLivro)
        });

        if (resposta.ok) {
            formAdicionar.reset();
            buscarLivrosDaAPI(); 
        }
    } catch (erro) {
        console.error("Falha ao adicionar livro:", erro);
    }
});

// 5. ATUALIZAR STATUS (PUT)
async function atualizarStatus(livro) {
    const livroAtualizado = {
        titulo: livro.titulo,
        autor: livro.autor,
        url_imagem: livro.url_imagem,
        disponivel: !livro.disponivel 
    };

    try {
        await fetch(`${API_URL}/${livro.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(livroAtualizado)
        });
        buscarLivrosDaAPI();
    } catch (erro) {
        console.error("Falha ao atualizar status:", erro);
    }
}

// 6. DELETAR LIVRO (DELETE)
async function deletarLivro(id) {
    if(confirm("Tem certeza que deseja excluir este livro?")) {
        try {
            await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            buscarLivrosDaAPI();
        } catch (erro) {
            console.error("Falha ao deletar:", erro);
        }
    }
}

// Inicia buscando os livros quando a página carrega
document.addEventListener("DOMContentLoaded", buscarLivrosDaAPI);