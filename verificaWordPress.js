const axios = require('axios');
const readline = require('readline');

// Definindo o token da API da WPScan
const API_TOKEN = 'Sua Chave de API';

// Definindo a URL base da API da WPScan
const API_BASE_URL = 'https://wpscan.com/api/v3/';

// Função para verificar a versão do WordPress no site
async function getWordPressVersion(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
            },
        });

        const html = response.data;

        // Procurar por um comentário ou meta tag com a versão do WordPress
        const versionRegex = /<meta name="generator" content="WordPress (\d+\.\d+\.\d+)/;
        const match = versionRegex.exec(html);

        if (match) {
            return match[1]; // Retorna a versão do WordPress encontrada
        } else {
            return 'Versão não encontrada';
        }
    } catch (error) {
        console.error(`Erro ao buscar versão do WordPress: ${error.message}`);
        return 'Erro ao buscar versão';
    }
}

// Função para verificar plugins diretamente do site e suas versões
async function getInstalledPlugins(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
            },
        });

        const html = response.data;

        // Procurar por plugins no conteúdo da página (os plugins do WordPress geralmente têm URLs como /wp-content/plugins/)
        const pluginRegex = /\/wp-content\/plugins\/([^\/]+)/g;
        let plugins = [];
        let match;

        while ((match = pluginRegex.exec(html)) !== null) {
            plugins.push(match[1]); // Captura o nome do plugin
        }

        if (plugins.length > 0) {
            console.log('Plugins encontrados no site:');
            plugins = [...new Set(plugins)]; // Remover duplicatas
            for (let i = 0; i < plugins.length; i++) {
                // Tentamos buscar a versão de cada plugin, se disponível
                await getPluginVersion(plugins[i]);
            }
        } else {
            console.log('Nenhum plugin encontrado no site.');
        }

    } catch (error) {
        console.error(`Erro ao buscar plugins: ${error.message}`);
    }
}

// Função para buscar a versão do plugin usando a API da WPScan
async function getPluginVersion(pluginSlug) {
    try {
        const url = `${API_BASE_URL}plugins/${pluginSlug}`;

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Token token=${API_TOKEN}`,
            },
        });

        if (response.data && response.data.plugin) {
            console.log(`Plugin: ${response.data.plugin.slug} - Versão mais recente: ${response.data.plugin.latest_version}`);
        } else {
            console.log(`Plugin ${pluginSlug}: Versão não encontrada`);
        }

    } catch (error) {
        console.error(`Erro ao buscar versão do plugin ${pluginSlug}: ${error.message}`);
    }
}

// Função para verificar o status do usuário na WPScan
async function getStatus() {
    try {
        const url = `${API_BASE_URL}status`;

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Token token=${API_TOKEN}`,
            },
        });

        if (response.data) {
            console.log('Status do plano da WPScan:');
            console.log(`Plano: ${response.data.plan}`);
            console.log(`Limite de requisições: ${response.data.request_limit}`);
            console.log(`Chamadas restantes: ${response.data.requests_remaining}`);
        } else {
            console.log('Não foi possível obter o status do plano.');
        }
    } catch (error) {
        console.error(`Erro ao buscar status: ${error.message}`);
    }
}

// Configura o readline para receber a URL do terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Solicita ao usuário que insira uma URL
rl.question('Digite a URL do site para verificar plugins: ', async (url) => {
    // Garante que a URL tenha o protocolo HTTP ou HTTPS
    if (!/^https?:\/\//i.test(url)) {
        url = `http://${url}`;
    }

    console.log(`Verificando o site: ${url}`);

    // Verifica o status da WPScan
    await getStatus();

    // Obtém a versão do WordPress
    const wpVersion = await getWordPressVersion(url);
    console.log(`Versão do WordPress: ${wpVersion}`);

    // Exibe os plugins instalados no site e suas versões
    await getInstalledPlugins(url);

    rl.close();
});
