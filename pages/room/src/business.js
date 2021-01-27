class Business {

    constructor({ room, media, view, socketBuilder, peerBuilder }) {
        this.media = media;
        this.room = room;
        this.view = view;

        this.peerBuilder = peerBuilder;

        // se o usuario estiver conetado ele faz a build para o servidor que estar rodando por trás 
        this.socketBuilder = socketBuilder;

        this.currentStream = {};
        this.socket = {};
        this.currentPeer = {};

        this.peers = new Map();
    }

    // inicializa o controlador businnes com as dependencias e intanciando elas no app.js
    static initialize(deps) {
        const instance = new Business(deps);
        return instance._init();
    }

    // aqui a função init anste de tudo pede permisão do usuario e se
    // ele aceita ela roda a função para acessar a camera do navegador
    async _init() {

        this.currentStream = await this.media.getCamera();
        this.socket = this.socketBuilder
            .setOnUserConnected(this.onUserConnected())
            .setOnUserDisconnected(this.onUserDisconnected())
            .build();

        this.currentPeer = await this.peerBuilder
            .setOnError(this.onPeerError())
            .setOnConnectionOpened(this.onPeerConnectionOpened())
            .setOnCallReceived(this.onPeerCallReceived())
            .setOnPeerStreamReceived(this.onPeerStreamReceived())
            .build()


        this.addVideoStream('teste01');

    }

    // A funçao captura o id do usuario apra renderizar as telas de videos de todos os usuarios na chamdada
    addVideoStream(userId, stream = this.currentStream) {
        const isCurrentId = false;
        this.view.renderVideo({
            userId,
            stream,
            isCurrentId
        })
    }

    // se tiver conecatdo ele retorna o id do usuario atraves do socket.io
    onUserConnected = function () {
        return userId => {
            console.log('user connected', userId);
            this.currentPeer.call(userId, this.currentStream)
        }

    }

    onUserDisconnected = function () {
        return userId => {
            console.log('user disconnected', userId);
        }
    }

    onPeerError = function () {
        return error => {
            console.error('error on peer', error);
        }
    }

    onPeerConnectionOpened = function () {
        return (peer) => {
            console.log('peer ta vivo', peer)
            const id = peer.id
            this.socket.emit('join-room', this.room, id);

        }
    }

    onPeerCallReceived = function () {
        return call => {
            console.log("respondendo uma chamada", call)
            call.answer(this.currentStream)
        }
    }

    onPeerStreamReceived = function () {
        return (call, stream) => {
            const callerId = call.peer;
            this.addVideoStream(callerId, stream)
            this.peers.set(callerId, { call })

            this.view.setParticipantes(this.peers.size)
        }

    }

}