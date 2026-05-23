// Arquivo: index.js

// --- TRAVAS DE SEGURANÇA CONTRA CRASHES DE CONEXÃO E CANAL DE VOZ ---
process.emitWarning = () => {}; 
process.env.NODE_NO_WARNINGS = '1';

// Impede que erros de rede ou socket de voz derrubem o terminal
process.on('unhandledRejection', (reason, promise) => {
    // Se o erro for do socket de voz, ele ignora silenciosamente e mantém o bot online
    if (reason?.message?.includes('IP discovery') || reason?.message?.includes('socket closed')) {
        return; 
    }
    console.error('⚠️ Rejeição não tratada:', reason);
});

process.on('uncaughtException', (err, origin) => {
    if (err?.message?.includes('IP discovery') || err?.message?.includes('socket closed')) {
        return;
    }
    console.error('⚠️ Exceção não capturada:', err);
});
// ------------------------------------------------------------------

const { Client, GatewayIntentBits, Collection, EmbedBuilder, AuditLogEvent } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ... (resto do seu código do index.js continua exatamente igual abaixo)

const PREFIX = 'r!';
const OWNER_ID = 'ID DO OWNER PRA COMANDOS! E BYPASS'; // ID PT

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,     
        GatewayIntentBits.GuildVoiceStates  
    ]
});

client.commands = new Collection();
const floodMap = new Map(); 
const deletarCanaisMap = new Map(); 

// --- CARREGADOR DE COMANDOS MECÂNICO ---
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        if ('name' in command && 'execute' in command) {
            
            // 🟩 INJETOR DE CATEGORIA (Essencial para os botões do help funcionarem)
            command.category = folder.toLowerCase();
            
            client.commands.set(command.name, command);
        }
    }
}

const palavrasProibidas = ["macaco", "crioulo", "viadinho", "infame", "verme", "traveco"]; 

// --- ROTEAÇÃO AVANÇADA DE LOGS POR SERVIDOR ---
async function enviarLog(guild, tipoLog, embed) {
    try {
        const configs = JSON.parse(fs.readFileSync('./database/config.json', 'utf-8'));
        const serverConfig = configs[guild.id];
        if (!serverConfig) return;

        const canalId = serverConfig[tipoLog];
        if (!canalId) return;

        const canalLog = guild.channels.cache.get(canalId);
        if (canalLog && canalLog.permissionsFor(guild.members.me).has('SendMessages')) {
            canalLog.send({ embeds: [embed] }).catch(() => {});
        }
    } catch (e) {}
}

function registrarInfracao(guildId, userId, tipo, motivo) {
    let dados = JSON.parse(fs.readFileSync('./database/punicoes.json', 'utf-8'));
    if (!dados[guildId]) dados[guildId] = {};
    if (!dados[guildId][userId]) dados[guildId][userId] = { warns: 0, mutes: 0, bans: 0, historico: [] };
    dados[guildId][userId][tipo]++;
    dados[guildId][userId].historico.push({
        tipo: tipo.toUpperCase(), motivo: motivo, data: new Date().toLocaleDateString('pt-BR')
    });
    fs.writeFileSync('./database/punicoes.json', JSON.stringify(dados, null, 2));
}

// TIMEOUT CHECKER AUTOMÁTICO
setInterval(() => {
    try {
        let dados = JSON.parse(fs.readFileSync('./database/punicoes.json', 'utf-8'));
        const agora = Date.now();
        let mudou = false;
        for (const guildId in dados) {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) continue;
            for (const userId in dados[guildId]) {
                const muteData = dados[guildId][userId].muteAtivo;
                if (muteData && agora > muteData.expiresAt) {
                    const member = guild.members.cache.get(userId);
                    if (member) member.timeout(null).catch(() => {});
                    delete dados[guildId][userId].muteAtivo;
                    mudou = true;
                }
            }
        }
        if (mudou) fs.writeFileSync('./database/punicoes.json', JSON.stringify(dados, null, 2));
    } catch (e) {}
}, 10000);

// --- EVENTO: REINICIALIZAÇÃO COM STATUS ROTATIVO DINÂMICO ---
client.once('ready', () => {
    console.clear(); 
    console.log('==================================================');
    console.log(`🛡️   RETH MORGAN SHIELD SYSTEM V7 ONLINE`);
    console.log(`🔗 Logado como: ${client.user.tag}`);
    console.log('==================================================');

    const statusList = [
        { name: 'r!painel | Proteger Servidores 🛡️', type: 3 },
        { name: `Segurança Máxima em ${client.guilds.cache.size} servidores! 🏢`, type: 0 },
        { name: 'Protocolo Anti-Nuke Ativo ☢️', type: 2 },
        { name: 'Desenvolvido por PT 👑', type: 0 }, //
        { name: 'Use r!help para ver meus comandos 🚀', type: 0 }
    ];

    let index = 0;
    setInterval(() => {
        const currentStatus = statusList[index];
        client.user.setPresence({
            activities: [{ name: currentStatus.name, type: currentStatus.type }],
            status: 'dnd' 
        });
        index = (index + 1) % statusList.length;
    }, 15000);
});

// --- EVENTO CENTRAL: ENTRADA DE MEMBROS ---
client.on('guildMemberAdd', async (member) => {
    const guild = member.guild;
    let configs = {};
    try {
        configs = JSON.parse(fs.readFileSync('./database/config.json', 'utf-8'));
    } catch (e) { return; }
    
    const serverConfig = configs[guild.id] || {};

    // 1. AUTO-ROLE AUTOMÁTICO
    if (serverConfig.autorole) {
        const cargoAlvo = guild.roles.cache.get(serverConfig.autorole);
        if (cargoAlvo) await member.roles.add(cargoAlvo).catch(() => {});
    }

    // 2. MENSAGEM DE BOAS-VINDAS PÚBLICA
    if (serverConfig.msg_join) {
        const canalPublico = guild.channels.cache.get(serverConfig.msg_join);
        if (canalPublico) {
            canalPublico.send(`👋 Bem-vindo(a) <@${member.id}> ao servidor **${guild.name}**! Aproveite o chat!`).catch(() => {});
        }
    }

    // 3. LOGS DE ENTRADA INDEPENDENTE (LOG-JOIN)
    if (serverConfig.logs_join) {
        const joinEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setAuthor({ name: `${member.user.tag} entrou`, iconURL: member.user.displayAvatarURL() })
            .setDescription(`• Conta criada em: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n• ID do Usuário: \`${member.id}\``)
            .setTimestamp();
        enviarLog(guild, 'logs_join', joinEmbed);
    }

    // 4. BANIMENTO DE BOTS INVASORES E PUNÇÃO DE QUEM INJETOU
    if (member.user.bot && serverConfig.antibot) {
        try {
            await new Promise(res => setTimeout(res, 1000));
            const logsAuditoria = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.BotAdd }); 
            const logAdicao = logsAuditoria.entries.first();
            
            if (logAdicao) {
                const executor = logAdicao.executor;
                if (executor.id === OWNER_ID || executor.id === guild.ownerId) return;

                await member.ban({ reason: 'Reth Morgan: Entrada de bots não autorizada pelo Proprietário.' }).catch(() => {});
                
                const staffer = await guild.members.fetch(executor.id).catch(() => {});
                if (staffer) {
                    await staffer.ban({ reason: 'Reth Morgan Anti-Raid: Autor de injeção ilícita de bot invasor.' }).catch(() => {
                        const cargosRemoviveis = staffer.roles.cache.filter(r => r.id !== guild.id && !r.managed);
                        staffer.roles.remove(cargosRemoviveis).catch(() => {});
                    });
                }

                const logBotEmbed = new EmbedBuilder()
                    .setColor('#f53b57')
                    .setTitle('🚨 ALERTA GERAL: ATAQUE DE BOT REPELIDO')
                    .setDescription(`O administrador <@${executor.id}> quebrou as regras e tentou injetar um bot no servidor.`)
                    .addFields(
                        { name: '🤖 Bot Invasor Eliminado', value: `\`${member.user.tag}\` (${member.id})`, inline: true },
                        { name: '🔨 Punição ao Infrator', value: `\`Banido do Servidor / Permissões Cassadas\``, inline: true }
                    )
                    .setTimestamp();
                
                return enviarLog(guild, 'logs_seguranca', logBotEmbed);
            }
        } catch (error) {}
    }

    // 5. ANTI-CONTA FAKE
    if (serverConfig.antifake && !member.user.bot) {
        const contaCriadaHa = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24); 
        const limiteDias = serverConfig.diasFake || 7;

        if (contaCriadaHa < limiteDias) {
            await member.kick(`Reth Morgan System: Conta menor que ${limiteDias} dias.`).catch(() => {});
            
            const logFakeEmbed = new EmbedBuilder()
                .setColor('#f53b57')
                .setTitle('🚨 SEGURANÇA: CONTA FAKE EXPULSADA')
                .setDescription(`A conta suspeita **${member.user.tag}** foi removida por não atingir a idade mínima.`)
                .addFields(
                    { name: '⏳ Idade da Conta', value: `\`${Math.floor(contaCriadaHa)} dias\``, inline: true },
                    { name: '🔒 Mínimo Exigido', value: `\`${limiteDias} dias\``, inline: true }
                )
                .setTimestamp();

            return enviarLog(guild, 'logs_seguranca', logFakeEmbed);
        }
    }
});

// --- EVENTO: SAÍDA DE MEMBROS (LOGS_JOIN) ---
client.on('guildMemberRemove', async (member) => {
    const guild = member.guild;
    let configs = {};
    try { configs = JSON.parse(fs.readFileSync('./database/config.json', 'utf-8')); } catch (e) { return; }
    
    const serverConfig = configs[guild.id] || {};
    if (serverConfig.logs_join) {
        const leaveEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setAuthor({ name: `${member.user.tag} saiu`, iconURL: member.user.displayAvatarURL() })
            .setDescription(`🚪 O usuário deixou o servidor.\nID: \`${member.id}\``)
            .setTimestamp();
        enviarLog(guild, 'logs_join', leaveEmbed);
    }
});

// --- ANTI-MASS CHANNEL DELETE (ANTI-NUKE) ---
client.on('channelDelete', async (channel) => {
    const guild = channel.guild;
    let configs = {}; try { configs = JSON.parse(fs.readFileSync('./database/config.json', 'utf-8')); } catch (e) { return; }
    const serverConfig = configs[guild.id] || {};

    if (!serverConfig.antinuke) return;

    try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
        const entry = auditLogs.entries.first();
        if (!entry) return;

        const executor = entry.executor;
        if (executor.id === OWNER_ID || executor.id === guild.ownerId || executor.id === client.user.id) return;

        const agora = Date.now();
        if (!deletarCanaisMap.has(executor.id)) deletarCanaisMap.set(executor.id, []);
        
        const timestamps = deletarCanaisMap.get(executor.id);
        timestamps.push(agora);
        
        const exclusoesRecentes = timestamps.filter(time => agora - time < 10000);
        deletarCanaisMap.set(executor.id, exclusoesRecentes);

        if (exclusoesRecentes.length >= 3) {
            const member = await guild.members.fetch(executor.id).catch(() => {});
            if (member) {
                const cargosRemoviveis = member.roles.cache.filter(role => role.id !== guild.id && role.managed === false);
                await member.roles.remove(cargosRemoviveis).catch(() => {});
            }

            const embedAlerta = new EmbedBuilder()
                .setColor('#f53b57')
                .setTitle('🚨 ANTI-NUKE ACIONADO: PROTEÇÃO DE CANAIS')
                .setDescription(`O staffer <@${executor.id}> tentou deletar múltiplos canais. Privilégios revogados.`)
                .setTimestamp();
            enviarLog(guild, 'logs_seguranca', embedAlerta);
        }
    } catch (err) {}
});

// --- ANTI-ALTERAÇÃO DE CARGOS ADM ---
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const guild = newMember.guild;
    let configs = {}; try { configs = JSON.parse(fs.readFileSync('./database/config.json', 'utf-8')); } catch (e) { return; }
    const serverConfig = configs[guild.id] || {};

    if (!serverConfig.anticargos) return;

    const cargosGanhos = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    if (cargosGanhos.size === 0) return;

    const temAdmin = cargosGanhos.some(role => role.permissions.has('Administrator'));
    if (!temAdmin) return;

    try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate });
        const entry = auditLogs.entries.first();
        if (!entry) return;

        const executor = entry.executor;
        if (executor.id === OWNER_ID || executor.id === guild.ownerId || executor.id === client.user.id) return;

        await newMember.roles.remove(cargosGanhos).catch(() => {});

        const embedCargoErrado = new EmbedBuilder()
            .setColor('#f53b57')
            .setTitle('🚨 SOBERANIA REVOGADA: CARGO ADM NEGADO')
            .setDescription(`O moderador <@${executor.id}> tentou promover <@${newMember.id}> para cargo Administrativo ilicitamente.`)
            .setTimestamp();
        enviarLog(guild, 'logs_seguranca', embedCargoErrado);
    } catch (err) {}
});

// --- MONITORAMENTO DE MENSAGENS APAGADAS (LOGS_MSG) ---
client.on('messageDelete', async (msg) => {
    if (!msg.guild || msg.author?.bot) return;

    const logDeletadoEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('📝 MENSAGEM DELETADA')
        .addFields(
            { name: '👤 Autor', value: `<@${msg.author.id}> (\`${msg.author.id}\`)`, inline: true },
            { name: '📍 Canal', value: `<#${msg.channel.id}>`, inline: true },
            { name: '💬 Conteúdo Antigo', value: `\`\`\`${msg.content || '[Imagem/Arquivo]'}\`\`\``, inline: false }
        )
        .setTimestamp();

    enviarLog(msg.guild, 'logs_msg', logDeletadoEmbed);
});

// --- PROCESSADOR CENTRAL DE CHAT, SEGURANÇA E COMANDOS ---
client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.guild) return;

    let configs = {};
    try { configs = JSON.parse(fs.readFileSync('./database/config.json', 'utf-8')); } catch (e) { configs = {}; }
    const serverConfig = configs[msg.guild.id] || {};

    // VERIFICAÇÃO DE IMUNIDADE: Donos ou cargos na Whitelist do Painel (Bypass)
    const eDonoSupremo = msg.author.id === OWNER_ID;
    const eDonoServer = msg.author.id === msg.guild.ownerId;
    const possuiCargoBypass = msg.member.roles.cache.some(role => serverConfig.bypass_roles?.includes(role.id));
    const imune = eDonoSupremo || eDonoServer || possuiCargoBypass;

    if (!imune) {
        // A) FILTRO ANTI-PRECONCEITO
        if (serverConfig.antipreconceito) {
            const msgMin = msg.content.toLowerCase();
            if (palavrasProibidas.some(p => msgMin.includes(p))) {
                await msg.delete().catch(() => {});
                await msg.member.timeout(2 * 60 * 60 * 1000, 'Reth Morgan System: Crime de ódio/Preconceito no chat.').catch(() => {});
                registrarInfracao(msg.guild.id, msg.author.id, 'mutes', 'Uso de termos preconceituosos');

                const logPrecoEmbed = new EmbedBuilder()
                    .setColor('#f53b57')
                    .setTitle('🚨 CRIME DE ÓDIO FILTRADO')
                    .setDescription(`Infrator: <@${msg.author.id}>\nPunição: Deletado & Castigo de 2h.`);
                
                enviarLog(msg.guild, 'logs_seguranca', logPrecoEmbed);
                return msg.channel.send(`🛑 **ANTI-PRECONCEITO:** <@${msg.author.id}> silenciado por 2 horas.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
            }
        }

        // B) FILTRO ANTI-FLOOD DINÂMICO
        if (serverConfig.antiflood) {
            const usuarioId = msg.author.id;
            const agora = Date.now();
            if (!floodMap.has(usuarioId)) floodMap.set(usuarioId, []);
            const ts = floodMap.get(usuarioId);
            ts.push(agora);
            const rec = ts.filter(t => agora - t < 4000);
            floodMap.set(usuarioId, rec);
            
            if (rec.length >= (serverConfig.limiteFlood || 5)) {
                await msg.delete().catch(() => {});
                await msg.member.timeout(10 * 60 * 1000, 'Reth Morgan: Flood detectado.').catch(() => {});
                floodMap.delete(usuarioId);

                const logFloodEmbed = new EmbedBuilder()
                    .setColor('#f53b57')
                    .setTitle('🚨 SPAM: ANTI-FLOOD ACIONADO')
                    .setDescription(`O usuário <@${usuarioId}> flodou mensagens muito rápido.`);
                enviarLog(msg.guild, 'logs_seguranca', logFloodEmbed);
                return msg.channel.send(`🛑 **ANTI-FLOOD:** <@${msg.author.id}> mutado por 10 minutos por spam.`);
            }
        }
    }

    // --- EXECUÇÃO LOGÍSTICA DE COMANDOS ---
    if (!msg.content.startsWith(PREFIX)) return;
    const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;

    if (command.ownerOnly && msg.author.id !== OWNER_ID) return;

    if (eDonoSupremo) msg.member.permissions.has = function() { return true; };

    try {
        await command.execute(msg, args, client, OWNER_ID);
        
        // ENVIO DE LOGS_STAFF QUANDO UM COMANDO FOR USADO
        if (msg.content.startsWith(PREFIX) && !command.ownerOnly) {
            const logStaffEmbed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('👮 COMANDO EXECUTADO PELA STAFF')
                .addFields(
                    { name: '👤 Operador', value: `<@${msg.author.id}>`, inline: true },
                    { name: '💬 Expressão', value: `\`${msg.content}\``, inline: true }
                )
                .setTimestamp();
            enviarLog(msg.guild, 'logs_staff', logStaffEmbed);
        }
    } catch (error) {
        console.error(error);
    }
});

client.login('TOKEN DO SEU BOT');