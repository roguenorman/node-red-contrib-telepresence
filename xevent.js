module.exports = function(RED) {
    function xevent(config) {
        RED.nodes.createNode(this,config);
        this.endpoint = RED.nodes.getNode(config.endpoint);
        this.event = config.event;
        var node = this;
        this.off = Object;

        if (this.endpoint) {
            this.status({fill:"red",shape:"ring",text:"disconnected"});
            this.endpoint.register(node);
            this.log("endpoint.state.connected: " + this.endpoint.endpointUrl);
        }

        this.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }

            if (msg.hasOwnProperty("payload")) {
                if (typeof msg.payload === "string"){
                    node.event = msg.payload;
                }
            }
            if (node.event != ""){
                this.log("xevent.subscribed: " + node.event);
                node.off = this.endpoint.xapi.event
                .on(node.event, (event) => {
                    msg.payload = {event: event};
                    send(msg);
                    return
                });

                msg.payload = {"event" : node.event, "listening": true };
                send(msg)


                if (done) {
                    done();
                }
            }
        });

        this.on('close', function(done) {
            this.log("xevent.unsubscribed: " + node.event);
            node.off();
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
    RED.nodes.registerType("xevent",xevent);
}
