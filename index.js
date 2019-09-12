const WebSocket = require('ws');
let wsServer = null;
let connected = false;
let wsConnections = {};
let lastFrame = null;
let resolvePromise = null;
const mocks = [
    {
        view: 'hellow',
        buttons: [
            {label: 'oh hi mark', submitData: 'i_did_not_hit_her'},
            {label: 'another', submitData: 'another'}
        ]
    },
    {
        view: 'headers',
        title: 'lorem ipsum',
        subtitle: 'sit amed dolores'
    },
    {
        view: 'tiles',
        buttons: [
            {label: 'one', submitData: 'one'},
            {label: 'two', submitData: 'two'},
            {label: 'three', submitData: 'three'},
            {label: 'four', submitData: 'four'},
            {label: 'five', submitData: 'five'},
            {label: 'six', submitData: 'six'},
        ]
    },
    {
        view: 'headers',
        title: 'another great title',
        subtitle: 'and fantastic subtitle'
    },
    {
        view: 'headers',
        title: 'please wait',
        subtitle: 'processing'
    },
    {
        view: 'tiles',
        buttons: [
            {label: '11a', submitData: 'one'},
            {label: '12b', submitData: 'two'},
            {label: '13c', submitData: 'three'},
            {label: '14d', submitData: 'four'},
            {label: '15e', submitData: 'five'},
            {label: '16f', submitData: 'six'},
        ]
    },
    {
        view: 'hellow',
        buttons: [
            {label: 'aaa1aaa', submitData: 'aaa1aaa'},
            {label: 'bbb2aaa', submitData: 'bbb2aaa'},
            {label: 'ccc3aaa', submitData: 'ccc3aaa'},
        ]
    },
    {
        view: 'headers',
        title: 'wait for it',
        subtitle: 'maybe no?'
    },
];

init();


function init() {
    connect().then(() => {
        sendFrames(mocks)
    });

    function sendFrames(queue) {
        for (let [index, frame] of queue.entries()) {
            setTimeout(() => {
                sendToConnectedClients(frame);
                if (index+1 === queue.length) {
                    setTimeout(() => {
                        sendFrames(queue);
                    }, 1000)
                }
            }, index * 1000)
        }
    }
}


function sendToConnectedClients(newFrame) {
    lastFrame = newFrame;

    connect().then(() => {
        console.warn('send', JSON.stringify(newFrame));
        for (let connected of Object.values(wsConnections)) {
            connected.send(JSON.stringify(newFrame));
        }
    })
}


function connect() {
    if (!wsServer) {
        wsServer = new WebSocket.Server({port: 8080});

        wsServer.on('connection', (ws, req) => {
            wsConnections[req.headers['sec-websocket-key']] = ws;
            connected = true;
            resolvePromise(connected);

            for (let [id, connected] of Object.entries(wsConnections)) {
                if (lastFrame) {
                    connected.send(JSON.stringify(lastFrame));
                }

                connected.on('message', (message) => {
                    console.log('message received:', message);
                });

                connected.on('close', () => {
                    delete wsConnections[id];
                    connected = !!Object.keys(wsConnections).length;
                    console.log('connection closed');
                });
            }
        });
    }

    return new Promise((resolve) => {
        if (connected) {
            resolve(connected);
        } else {
            resolvePromise = resolve;
        }
    });
}
