module.exports = function(RED) {
    function xstatus(config) {
        RED.nodes.createNode(this,config);
        this.endpoint = RED.nodes.getNode(config.endpoint);
        this.path = config.path;
        this.output = config.output;
        var node = this;

        if (this.endpoint) {
            this.status({fill:"red",shape:"ring",text:"disconnected"});
            this.endpoint.register(node);
            this.log("endpoint.state.connected: " + this.endpoint.endpointUrl);
        }

        this.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            
            // locally configured path should trump msg.payload
            // if local node does not have a path configured, try to get path from msg.payload
            if (node.path === "" && msg.hasOwnProperty("payload")){
                if (typeof msg.payload === "string"){
                    node.path = msg.payload;
                }
            }
            if (node.output === ""){
                node.output = "payload"
            }

            if (node.path != ""){
                this.endpoint.xapi.status
                .get(node.path)
                .then((response) => {
                    msg[node.output] = response;
                    send(msg); 
                })
                .catch((error) => { 
                    done(error); 
                });
                if (done) {
                    done();
                }
            }
           
        });

        this.on('close', function(done) {
            if (node.endpoint) {
                node.endpoint.deregister(node,done);
            }
            done();
        });

        if (this.endpoint.connected) {
            this.log("endpoint.state.connected: " + this.endpoint.endpointUrl);
            node.status({fill:"green",shape:"dot",text:"connected"});
        }

    }
    RED.nodes.registerType("xstatus",xstatus);
}
