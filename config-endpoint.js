module.exports = function(RED) {
    var jsxapi = require('jsxapi');


    function ConfigEndpointNode(config) {
        RED.nodes.createNode(this,config);
        this.username = this.credentials.username;
        this.password = this.credentials.password;
        this.ipaddr = config.ipaddr;
        this.usessl = config.usessl;
        this.endpointUrl = "";
        this.connected = false;
        this.connecting = false;
        this.closing = false;
        this.users = {};
        this.xapi = null;

        if (this.endpointUrl === "") {
            if (this.usessl) {
                this.endpointUrl="wss://";
            } else {
                this.endpointUrl="ws://";
            }
        }

        if (this.ipaddr !== "") {
            this.endpointUrl = this.endpointUrl+this.ipaddr;
        } else {
            this.endpointUrl = this.endpointUrl+"localhost";
        }
        this.log("endpoint.url: " + this.endpointUrl);

        // Define functions called by a tpnode
        var node = this;

        this.register = function(tpnode) {
            node.users[tpnode.id] = tpnode;
            if (Object.keys(node.users).length === 1) {
                node.connect();
            }
        };
    
        this.deregister = function(tpnode,done) {
            delete node.users[tpnode.id];

            if (node.closing) {
                return done();
            }

            if (Object.keys(node.users).length === 0) {
                if (node.xapi && node.connected) {
                    node.xapi.close();
                    return done();
                }
            }
            done();
        };

        this.connect = function () {
            if (!node.connected && !node.connecting) {
                node.connecting = true;

                jsxapi.connect(this.endpointUrl, { 
                    username: this.username,
                    password: this.password
                })
                .on('error', (error) => {
                    node.connected = false;
                    this.log("endpoint.state.disconnected: " + this.endpointUrl + " " + error);
                    node.status({fill:"red",shape:"ring",text:"disconnected"});
                })
                
                .on('ready', async (xapi) => {
                    node.connecting = false;
                    node.connected = true;
                    this.xapi = xapi;
                    this.log("endpoint.state.connected: " + this.endpointUrl);
                    for (var id in node.users) {
                        if (node.users.hasOwnProperty(id)) {
                            node.users[id].status({fill:"green",shape:"dot",text:"connected"});
                        }
                    }
                });
            }
        
        }

        this.send = function () {
            if (node.xapi && node.connected) {
            }
        }

        
        node.on('close', function() {
            this.closing = true;
            if (node.connected) {
                node.connected = false;
                node.log("endpoint.state.disconnected: " + this.endpointUrl);
                for (var id in node.users) {
                    if (node.users.hasOwnProperty(id)) {
                        node.users[id].status({fill:"red",shape:"ring",text:"disconnected"});
                    }
                }
                this.xapi.close()
            }
            done();
        });

    }
    RED.nodes.registerType("config-endpoint",ConfigEndpointNode,{
        credentials: {
            username: {type:"text"},
            password: {type: "password"}
        }

    });
}
