# 🛡️ Reth Morgan Shield System — V7

O **Reth Morgan Shield System** é um bot de segurança avançada, automação e infraestrutura para servidores do Discord, desenvolvido inteiramente em **JavaScript** utilizando a biblioteca **Discord.js v14** e **Node.js**.

O foco principal do projeto é a soberania e estabilidade do servidor, unindo módulos pesados de proteção contra invasões (Anti-Nuke) com ferramentas completas de gerenciamento para a staff.

---

## 🚀 Funcionalidades Principais

### 🔒 Módulo de Segurança Máxima (Anti-Nuke & Anti-Raid)
* **Anti-Bot Invasor:** Identifica e bane instantaneamente bots não autorizados que entram no servidor, além de cassar as permissões ou banir o administrador responsável pela injeção ilícita.
* **Anti-Mass Channel Delete:** Monitora e bloqueia staffers que tentam deletar múltiplos canais em um curto intervalo de tempo.
* **Anti-Alteração de Cargos Administrativos:** Bloqueia e reverte a concessão de cargos com a permissão de `Administrador` feita por moderadores não autorizados.
* **Anti-Conta Fake:** Sistema inteligente que expulsa automaticamente contas criadas recentemente (configuração padrão de segurança).

### 👮 Moderação & Filtros Automatizados
* **Filtro Anti-Preconceito:** Varredura em tempo real no chat com punição imediata (Timeout de 2 horas) e remoção da mensagem ao detectar termos proibidos ou crimes de ódio.
* **Filtro Anti-Flood:** Monitoramento dinâmico de spam. Silencia o usuário automaticamente por 10 minutos caso o limite de mensagens rápidas seja atingido.
* **Cofre de Backups Completo:** Cria pontos de restauração e snapshots manuais ou automáticos (ciclo de 12 horas) de cargos, canais e permissões para recuperação total.

### 📊 Sistema Central de Logs Avançado
Roteação mecânica e independente de logs direto para os canais configurados no banco de dados (`config.json`):
* **Logs de Entrada/Saída (`logs_join`)** com marcação de tempo e idade da conta.
* **Logs de Mensagens Deletadas (`logs_msg`)** mostrando o autor e o conteúdo antigo.
* **Logs de Comandos da Staff (`logs_staff`)** para auditoria completa de quem usou o bot.

### ⚙️ Interface Utilitária & Interativa
* **Menu Interativo (`r!help`):** Central interativa dividida por abas mecânicas com botões dinâmicos que listam as diretrizes ativas direto pelas pastas físicas do projeto (`security`, `mod`, `admin`, `info`, `fun`).
* **Status Rotativo Dinâmico:** Presença ativa com ciclos automáticos de informações no perfil do bot.
* **Tratamento Anti-Crash:** Blindagem total no escopo global contra erros de socket ou quedas de conexão UDP em chamadas de voz (`@discordjs/voice`).

---

## 🛠️ Tecnologias Utilizadas

* **Runtime:** Node.js (v24+)
* **Linguagem:** JavaScript (ES6+)
* **Biblioteca Principal:** Discord.js v14
* **Banco de Dados:** JSON Local (Mapeamento linear de diretórios)

---

## 👑 Desenvolvedor

Desenvolvido com foco em alta performance e segurança por **PT**.
