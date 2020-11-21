module.exports = function(RED) {
    function xcommand(config) {
        RED.nodes.createNode(this,config);
        this.endpoint = RED.nodes.getNode(config.endpoint);
        this.service = config.service;
        this.data = config.data;
        this.output = config.output;
        var node = this;


        if (this.endpoint) {
            this.status({fill:"red",shape:"ring",text:"disconnected"});
            this.endpoint.register(node);
            this.log("endpoint.state.connected: " + this.endpoint.endpointUrl);
        }

        this.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }

            // locally configured service/data should trump msg.payload
            // if local node does not have a service/data configured, try to get it from msg
            if (node.service === "" && msg.hasOwnProperty("service")){
                    if (typeof msg.service === "string"){ 
                    node.service = msg.service; 
                }
            }
            if (node.output === ""){
                node.output = "payload"
            }

            if (node.data === "" && msg.hasOwnProperty("data")){
                if (typeof msg.data === "string"){ 
                node.data = msg.data; 
            }
        }

            if (node.service != "" && node.data != ""){
                this.log("xcommand.sent: " + node.service + " " + node.data);
                // try to parse to json
                try {
                    var json = JSON.parse(node.data); 
                } catch (e) {
                    var json = node.data;
                }

                this.endpoint.xapi
                .command(node.service, json) 
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
            } // else if data/service missing
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
    RED.nodes.registerType("xcommand",xcommand);
}
