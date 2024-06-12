document.addEventListener('DOMContentLoaded', function() {
    // Obtém os botões e as telas
    var btnMinhasTarefas = document.getElementById('btn-minhas-tarefas');
    var btnCadastrarTarefas = document.getElementById('btn-cadastrar-tarefas');
    var telaMinhasTarefas = document.getElementById('tela-minhas-tarefas');
    var telaCadastroTarefas = document.getElementById('tela-cadastro-tarefas');
    var telaSemTarefas = document.getElementById('tela-sem-tarefas');
    
    // Exibe a tela de cadastro de tarefas diretamente ao carregar a página
    exibirTela(telaCadastroTarefas);
    
    // Adiciona os eventos de clique aos botões
    btnMinhasTarefas.addEventListener('click', function(e) {
        e.preventDefault();
        exibirTela(telaMinhasTarefas);
        exibirTarefas(); // Exibe as tarefas ao trocar para a tela de Minhas Tarefas
    });

    btnCadastrarTarefas.addEventListener('click', function(e) {
        e.preventDefault();
        // Oculta a tela "sem tarefas" quando a tela de cadastro de tarefas for exibida
        telaSemTarefas.style.display = 'none';
        exibirTela(telaCadastroTarefas);
    });
});

// Define a função de exibição para as telas
function exibirTela(tela) {
    // Obtém todas as telas
    var telaMinhasTarefas = document.getElementById('tela-minhas-tarefas');
    var telaCadastroTarefas = document.getElementById('tela-cadastro-tarefas');
    var telaEditarTarefas = document.getElementById('tela-editar-tarefas');

    // Oculta todas as telas
    telaMinhasTarefas.style.display = 'none';
    telaCadastroTarefas.style.display = 'none';
    telaEditarTarefas.style.display = 'none';

    // Exibe a tela solicitada
    tela.style.display = 'block';
}

var db;
var idTarefaAtual;

function abrirBancoDeDados() {
    var request = indexedDB.open('tarefas', 1);

    request.onupgradeneeded = function(e) {
        db = e.target.result;
        if (!db.objectStoreNames.contains('tarefas')) {
            db.createObjectStore('tarefas', { keyPath: 'id', autoIncrement: true });
        }
    };

    request.onsuccess = function(e) {
        db = e.target.result;
    };

    request.onerror = function(e) {
        console.log('Erro ao abrir o banco de dados', e);
    };
}

function adicionarTarefa(tarefa) {
    var transacao = db.transaction(['tarefas'], 'readwrite');
    var store = transacao.objectStore('tarefas');
    var request = store.add(tarefa);

    request.onsuccess = function(e) {
        console.log('Tarefa adicionada com sucesso');
        exibirTarefas();
    };

    request.onerror = function(e) {
        console.log('Erro ao adicionar tarefa', e);
    };
}

function excluirTarefa(id) {
    var transacao = db.transaction(['tarefas'], 'readwrite');
    var store = transacao.objectStore('tarefas');
    var request = store.delete(id);

    request.onsuccess = function(e) {
        console.log('Tarefa excluída com sucesso, id:', id);
        // Após excluir a tarefa com sucesso, chama a função para exibir as tarefas atualizadas
        exibirTarefas();
    };

    request.onerror = function(e) {
        console.log('Erro ao excluir tarefa, id:', id, 'erro:', e);
    };
}

function exibirTarefas(pesquisa, status, prioridade) {
    const objectStore = db.transaction("tarefas").objectStore("tarefas");

    // Limpa a tabela antes de inserir novas linhas
    const tabela = document.getElementById('tabela-tarefas');
    while (tabela.rows.length > 1) {
        tabela.deleteRow(1);
    }
    
    let temTarefas = false; // Variável para verificar se há tarefas
    
    objectStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            temTarefas = true; // Indica que há tarefas
            const tarefa = cursor.value;

            // Verifica se o prazo da tarefa está próximo ou vencido
            const prazo = new Date(tarefa.data);
            const hoje = new Date();
            const diferencaDias = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));

            // Adiciona uma classe à célula da tabela com base no prazo da tarefa
            const linha = tabela.insertRow();
            const tituloCelula = linha.insertCell();
            const descricaoCelula = linha.insertCell();
            const dataCelula = linha.insertCell();
            const prioridadeCelula = linha.insertCell();
            const statusCelula = linha.insertCell();
            const acoesCelula = linha.insertCell();

            tituloCelula.textContent = tarefa.titulo;
            descricaoCelula.textContent = tarefa.descricao;
            dataCelula.textContent = converteData(tarefa.data);
            prioridadeCelula.textContent = tarefa.prioridade;
            statusCelula.textContent = tarefa.status.charAt(0).toUpperCase() + tarefa.status.slice(1).toLowerCase();

            // Adiciona o atributo 'title' às células
            tituloCelula.title = tarefa.titulo;
            descricaoCelula.title = tarefa.descricao;

            // Verifica e exibe um símbolo ao lado da data para indicar o status
            if (diferencaDias <= 0) {
                dataCelula.innerHTML = `${converteData(tarefa.data)} <i class="fa-solid fa-exclamation-circle" style="color: red;"></i>`; // Símbolo de aviso (círculo de exclamação)
            } else if (diferencaDias <= 7) {
                dataCelula.innerHTML = `${converteData(tarefa.data)} <i class="fa-solid fa-clock" style="color: orange;"></i>`; // Símbolo de relógio
            } else {
                dataCelula.textContent = converteData(tarefa.data);
            }

            // Aplica a classe CSS com base no prazo da tarefa
            if (diferencaDias <= 0) {
                dataCelula.classList.add('prazo-vencido');
            } else if (diferencaDias <= 7) {
                dataCelula.classList.add('proximo-prazo');
            }

            // Cria os botões de exclusão e edição
            const botaoExcluir = document.createElement('button');
            botaoExcluir.innerHTML = '<i class="fa-solid fa-trash"></i>';
            botaoExcluir.classList.add('delete-btn', 'acao-btn'); // Adiciona as classes 'delete-btn' e 'acao-btn' ao botão
            botaoExcluir.onclick = function() {
                excluirTarefa(tarefa.id);
                linha.remove(); // Remove a linha da tabela
            };
            acoesCelula.appendChild(botaoExcluir);

            const botaoEditar = document.createElement('button');
            botaoEditar.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
            botaoEditar.classList.add('edit-btn', 'acao-btn'); // Adiciona as classes 'edit-btn' e 'acao-btn' ao botão
            botaoEditar.onclick = function() {
                editarTarefa(tarefa.id); // Passa o ID da tarefa para a função editarTarefa
            };
            acoesCelula.appendChild(botaoEditar);

            cursor.continue();
        } else {
            // Se não houver tarefas, exibe a tela sem tarefas
            if (!temTarefas) {
                // Exibe a tela sem tarefas e oculta a tabela
                exibirTela(document.getElementById('tela-sem-tarefas'));
                tabela.style.display = 'none';
            } else {
                // Se houver tarefas, exibe a tabela normalmente
                tabela.style.display = 'table'; // Exibe a tabela
            }
        }
    };
}

function converteData(dataString) {
    var partesData = dataString.split('-');
    return partesData[2] + '/' + partesData[1] + '/' + partesData[0];
}

function editarTarefa(id) {
     // Armazena o ID da tarefa globalmente
    idTarefaAtual = id; // Assumindo que você já declarou uma variável global idTarefaAtual

    var transacao = db.transaction(['tarefas'], 'readonly');
    var store = transacao.objectStore('tarefas');
    var request = store.get(id);
    
    request.onsuccess = function(e) {
        var tarefa = e.target.result;

        // Preenche os campos do formulário de edição com os dados da tarefa
        document.getElementById('titulo-editar').value = tarefa.titulo;
        document.getElementById('descricao-editar').value = tarefa.descricao;
        document.getElementById('data-editar').value = tarefa.data;
        document.getElementById('prioridade-editar').value = tarefa.prioridade;
        document.getElementById('status-editar').value = tarefa.status;

        // Exibe a tela de edição
        exibirTela(document.getElementById('tela-editar-tarefas'));
    };

    request.onerror = function(e) {
        console.log('Erro ao obter tarefa', e);
    };
}

window.onload = function() {
    abrirBancoDeDados();

        // Listener para o evento de clique no botão de edição
    document.querySelectorAll('.edit-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            // Obtém o ID da tarefa diretamente do botão clicado
            var idTarefaSelecionada = this.dataset.id;
            // Chama a função de edição de tarefa passando o ID da tarefa
            editarTarefa(idTarefaSelecionada);
        });
    });

    document.getElementById('btn-minhas-tarefas').addEventListener('click', function(e) {
        e.preventDefault();
        exibirTarefas();
    });

    document.getElementById('btn-cadastrar-tarefas').addEventListener('click', function(e) {
        e.preventDefault();
    });

    document.querySelector('#tela-cadastro-tarefas form').addEventListener('submit', function(e) {
        e.preventDefault();
    
        // Verifica se todos os campos estão preenchidos
        if (!e.target.titulo.value || !e.target.descricao.value || !e.target.data.value || !e.target.prioridade.value || !e.target.status.value) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
    
        // Armazena os valores dos campos de entrada
        var titulo = e.target.titulo.value;
        var descricao = e.target.descricao.value;
        var data = e.target.data.value;
        var prioridade = e.target.prioridade.value;
        var status = e.target.status.value;
    
        // Limpa os campos de entrada
        e.target.titulo.value = '';
        e.target.descricao.value = '';
        e.target.data.value = '';
        e.target.prioridade.value = '';
        e.target.status.selectedIndex = 0;
    
        // Cria a tarefa
        var tarefa = {
            titulo: titulo,
            descricao: descricao,
            data: data,
            prioridade: prioridade,
            status: status
        };
    
        // Adiciona a tarefa
        adicionarTarefa(tarefa);
        
        // Exibe um alerta
        alert('Tarefa criada com sucesso!');
    
        // Vai para a tela de Minhas Tarefas
        exibirTela(document.getElementById('tela-minhas-tarefas'));
    });

    document.getElementById('editar-tarefas').addEventListener('submit', function(e) {
        e.preventDefault();

        // Verifica se todos os campos estão preenchidos
        if (!e.target.titulo.value || !e.target.descricao.value || !e.target.data.value || !e.target.prioridade.value || !e.target.status.value) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
    
        // Obtém os valores dos campos de entrada
        var titulo = e.target.titulo.value;
        var descricao = e.target.descricao.value;
        var data = e.target.data.value;
        var prioridade = e.target.prioridade.value;
        var status = e.target.status.value;
    
        // Cria a tarefa atualizada
        var tarefaAtualizada = {
            id: idTarefaAtual,
            titulo: titulo,
            descricao: descricao,
            data: data,
            prioridade: prioridade,
            status: status
        };
    
        // Atualiza a tarefa no banco de dados
        var transacao = db.transaction(['tarefas'], 'readwrite');
        var store = transacao.objectStore('tarefas');
        var request = store.put(tarefaAtualizada);
    
        request.onsuccess = function(e) {
            console.log('Tarefa atualizada com sucesso');
            alert('Tarefa atualizada com sucesso!');
            exibirTela(document.getElementById('tela-minhas-tarefas'));
            exibirTarefas();
        };        
    
        request.onerror = function(e) {
            console.log('Erro ao atualizar a tarefa', e);
        };
    });

    // Adiciona o atributo 'title' às células da tabela
    var cells = document.querySelectorAll("td");
    cells.forEach(function(cell) {
        cell.setAttribute("title", cell.innerText);
    });
};