/*
This programm is free software under CC creative common licence!
Author: Christian Pauly
*/

/**
 * Messaging Plugin for strophe.js
 *
 */

(function () {

	Strophe.addConnectionPlugin('messaging', {
		OnMessage: null,
		OnChatState: null,
		_connection: null,

		init: function (conn) {
			this._connection = conn;
			Strophe.addNamespace('XHTML_IM', 'http://jabber.org/protocol/xhtml-im');
            Strophe.addNamespace('XHTML', 'http://www.w3.org/1999/xhtml');
			Strophe.addNamespace('CHATSTATES', 'http://jabber.org/protocol/chatstates');
		},

		statusChanged: function (status, condition) {
            if (status === Strophe.Status.CONNECTED || status === Strophe.Status.ATTACHED) {
                this._connection.addHandler(this._messageHandler.bind(this), null, "message");
            }
        },


		messageHandler: function (stanza) {
			try
			{
				if ( stanza.hasAttribute("type") && stanza.attributes.type.value=="chat")
				{	console.info(stanza);
					var delay = false;
					var timestamp = new Date().getTime();
					var id = (timestamp + Math.random()) * 100000;
					var from = stanza.attributes["from"].value.match(/^[^\/]*/)[0];
					var chat = from;
					var direction = 'received';
					if ( Strophe.getBareJidFromJid ( chat ) == this._connection.authzid )
					{
						chat = stanza.attributes["to"].value.match(/^[^\/]*/)[0];
						direction = 'sent';
					}
					if ( delayElem = stanza.querySelector( "delay" ) )
					{
						delay = true;
						timestamp = delayElem.getAttribute ( "stamp" );
					}
					if( idElem = stanza.querySelector ( "origin-id" ) )
						id = idElem.getAttribute ( "id" );

					if( bodyElem = stanza.querySelector ( 'body' ) )
					{
						var messageBody = Strophe.getText ( bodyElem );
						newMessageObject=
						{
							chat: chat,
							from: from,
							type: stanza.attributes.type.value,
							body: messageBody,
							direction: direction,
							timestamp: timestamp,
							type: stanza.getAttribute("type"),
							id: id,
							delay: delay,
						}
						if ( this.OnMessage!=null )
							this.OnMessage(newMessageObject);
					}

					if( direction == "received" && this.OnChatState != null)
						if( stanza.querySelector("composing"))
							this.OnChatState( from, "composing" );
						else if( stanza.querySelector("paused"))
							this.OnChatState( from, "paused" );
						else if( stanza.querySelector("active"))
							this.OnChatState( from, "active" );
						else if( stanza.querySelector("inactive"))
							this.OnChatState( from, "inactive" );
						else if( stanza.querySelector("gone"))
							this.OnChatState( from, "gone" );
				}
			}
			catch(e)
			{
				console.warn(e.message);
				console.info(stanza);
			}
			return true;
		},

		send: function(to,message, receivedCallback )
		{
			var id =this._connection.getUniqueId();
			var imc = $msg({"id":id, "to":to, 'type':'chat'})
			.c("body")
			.t(message)
			.up()
			.c("request", {xmlns: "urn:xmpp:receipts"});

			if( receivedCallback != null)
				this._connection.addHandler(function(stanza)
				{
					if ( stanza.querySelector("error") != null && stanza.getAttribute("id") == id)
						receivedCallback(id, stanza.querySelector("error").firstChild.tagName);
					else if(stanza.querySelector("received") && stanza.querySelector("received").getAttribute("id") == id)
						receivedCallback(id, "received");
					return true;
				},
				"urn:xmpp:receipts", "message");


			this._connection.send( imc.tree());
			newMessageObject=
			{
				chat: to,
				from:this._connection.authzid,
				type:'chat',
				direction:'sent',
				body:message,
				delay: false,
				timestamp:new Date().getTime(),
				id: id,
			}
			if ( this.OnMessage!=null )
				this.OnMessage(newMessageObject);
		},

		SendChatState: function(to,chatState)
		{
			var imc = $msg({"id":XMPP.conn.getUniqueId(), xmlns: "jabber:client", from:XMPP.ownJID, "to":to, 'type':'chat'}).c(chatState, {xmlns: "http://jabber.org/protocol/chatstates"});
			XMPP.conn.send( imc.tree());
		},


	});

})();
