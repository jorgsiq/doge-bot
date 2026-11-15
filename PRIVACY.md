# Política de Privacidade do Đoge Bot

Última atualização: 4 de novembro de 2026 · [Read in English](PRIVACY.en.md)

Esta política explica quais dados o **Đoge Bot**, o bot do Discord mantido por Jorge Siqueira ("o desenvolvedor"), recebe, guarda e compartilha, e por quê. Ela complementa os [Termos de Serviço](TERMS.md).

## 1. O que o bot recebe do Discord

Como todo bot, o Đoge Bot recebe do Discord o necessário para responder aos comandos e fazer suas funções:

- quem usou um comando, em qual servidor e canal, e as opções escolhidas, como o nome de uma música ou a pessoa de um `/kiss`;
- o nome, o apelido, a foto de perfil e o ID dos membros dos servidores onde ele está;
- quem entra e sai dos canais de voz, para tocar música, parar quando todos saem e cuidar das salas temporárias;
- no canal de comandos, quem enviou cada mensagem, para apagá-la.

O bot não pede ao Discord acesso ao conteúdo das mensagens.

## 2. O que o bot guarda

O bot guarda, num arquivo no servidor onde ele roda, apenas:

- as configurações de cada servidor: as funções ativas e os IDs dos canais e cargos escolhidos em `/setup`;
- as salas temporárias abertas: o ID do canal e o ID de quem é dono da sala;
- quais alertas de jogos e fotos de shiba já foram publicados em cada servidor, para não repetir;
- o status que o bot mostra no Discord.

Todo o resto, como a fila de músicas, fica só na memória enquanto o bot está ligado e some quando ele reinicia. Registros técnicos de erros, que podem incluir, por exemplo, o nome de uma música que não pôde ser tocada, ficam no servidor de hospedagem e servem apenas para corrigir problemas.

## 3. O que o bot publica

- **Boas-vindas e registros**, quando ativos: no canal escolhido pelo servidor, o nome, a foto de perfil e o ID de quem entra, sai ou muda de apelido ou de foto. Na troca de foto, ele publica uma imagem com a foto antiga e a nova. Essas mensagens ficam no Discord, sob controle dos administradores do servidor.
- **Mensagens diretas**: boas-vindas a quem entra em um servidor com essa função ativa e convites para salas temporárias.
- **Interações**: o bot menciona as pessoas envolvidas, e o `/ship` usa a foto de perfil das duas pessoas para montar a imagem.

## 4. Com quem os dados são compartilhados

Só o necessário, e apenas com:

- o **Discord**, onde tudo acontece;
- o **YouTube Music** e o **Audius**: o texto pesquisado no `/play`, para achar a música;
- o **Spotify**: o link da playlist, do álbum ou da música colado no `/play`;
- o **nekos.best** e o **otakugifs**: só o tipo de reação (beijo, tapa...), sem nenhum dado de quem usou o comando;
- o **provedor de hospedagem** onde o bot roda, que guarda o arquivo de dados.

Os serviços de jogos (CheapShark, Epic Games Store e Steam) e o Wikimedia Commons não recebem dados de nenhum usuário. O bot não vende dados, não mostra anúncios e não usa ferramentas de rastreamento ou de análise.

## 5. Por quanto tempo os dados ficam guardados

- As salas temporárias saem do arquivo quando a sala é apagada.
- As configurações de um servidor e o histórico de alertas e fotos publicados ficam guardados até que alguém peça a remoção. Tirar o bot do servidor não apaga esses dados automaticamente.

## 6. Seus direitos

Você pode pedir para ver quais dados o bot guarda sobre você ou sobre o seu servidor, ou pedir que sejam apagados, pelo e-mail no fim desta página. Dependendo de onde você mora, como no Brasil (LGPD) ou na União Europeia (RGPD), você pode ter outros direitos sobre os seus dados, e eles serão respeitados.

Os administradores também podem desligar qualquer função em `/setup` ou remover o bot do servidor a qualquer momento.

## 7. Crianças

O bot segue a idade mínima exigida pelo Discord e não coleta de propósito dados de quem está abaixo dela.

## 8. Segurança

Os dados ficam num servidor com acesso restrito ao desenvolvedor. Ainda assim, nenhum sistema é totalmente seguro, e não há como garantir proteção absoluta.

## 9. Mudanças nesta política

Esta política pode mudar. A versão atual fica sempre nesta página, com a data da última atualização no topo.

## 10. Contato

Dúvidas ou pedidos sobre os seus dados: [support@jorgesiqueira.com](mailto:support@jorgesiqueira.com).
