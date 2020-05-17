sap.ui.define([
	"sap/ui/core/Control",
	"sap/ui/core/Fragment",
	'sap/m/MessageItem',
	'sap/m/MessageView',
	'sap/m/Button',
	'sap/m/Dialog',
	'sap/m/Bar',
	'sap/m/Text'
], function (Control, Fragment, MessageItem, MessageView, Button, Dialog, Bar, Text) {
	"use strict";

	var oLogDialog = Control.extend("com.ivancio.zal30-ui5.component.general.logDialog.LogDialog", {

		metadata: {
			properties: {
				logs: {
					type: "object"
				},
				title: {
					type: "string"
				}
			},
			events: {}
		},
		renderer: {},
		_mTypeCode: {
			S: "Success",
			W: "Warning",
			E: "Error"
		},

		//////////////////////////////////
		//                              //
		//        Public methods        //
		//                              //
		//////////////////////////////////
		init: function () {
			if (Control.prototype.init) {
				Control.prototype.init.apply(this, arguments);
			}

			this._initModel();
		},
		// Inicializa el modelo de datos interno
		resetModeData: function () {
			this._oLogDialogModel.setProperty("/title", "");
			this._oLogDialogModel.setProperty("/messages", []);
		},
		// Devuelve el tipo de mensaje para el control en base al tipo de mensaje del modelo
		formatMessageType: function (sType) {
			return this._mTypeCode[sType];
		},
		// Establece el titulo de la ventana
		setTitle: function (sTitle) {
			this._title = sTitle;			
		},
		// Añade un mensaje de manera individual
		addMessage: function (sType, sMessage) {
			var aMessages = this._oLogDialogModel.getProperty("/messages");

			aMessages.push({
				type: this.formatterMessageType(sType),
				message: sMessage
			});
			this._oLogDialogModel.setProperty("/messages", aMessages);
		},
		// Añade una lísta de mensajes.
		// Los campos de la estructura de datos deben ser:
		// type: que puede tener los valores S, W, E. Tal como se indica en la variable _mTypeCode
		// message: Mensaje a mostrar
		addMessages: function (aMessages) {
			// Se formatea el campo type
			for (var x = 0; x < aMessages.length; x++) {
				aMessages[x].type = this.formatterMessageType(aMessages[x].type);
			}

			this._oLogDialogModel.setProperty("/messages", aMessages);
		},
		// Función que permite pasar todos los valores de golpe. Este método 
		// siempre hará un reset de los valores precios
		setValues: function (sTitle, aMessages) {

			this.setTitle(sTitle); // Título
			this.addMessages(aMessages, true); // Se pasan los mensaje y se indica que se reseteen los valores

		},
		// Formatter del tipo de mensaje
		formatterMessageType: function (sType) {
			return this._mTypeCode[sType];
		},
		openDialog: function (oController) {
			this._oController = oController;
			var that = this;

			// NOTA IVAN: No hay manera de hacer funcionar el messageview con una dialogo en XML. Pero si que funciona, con javascript. Por
			// lo tanto uso ese camino
			/*this._sId = this.getId() + "--LogDialog";
			if (!this._oDialog) {
				Fragment.load({
					id: that._sId,
					name: "com.ivancio.zal30-ui5.component.general.logDialog.LogDialog",
					controller: that
				}).then(function (oDialog) {
					that._oDialog = oDialog;
					that.addDependent(oDialog);
					that._oDialog.open();
				});
			} else {
				this._oDialog.open();
			};*/

			var oMessageTemplate = new MessageItem({
				type: "{type}",
				title: "{message}"
			});

			this.oMessageView = new MessageView({
				items: {
					path: "/messages",
					template: oMessageTemplate
				}
			});
			this.oMessageView.setModel(this._oLogDialogModel);

			this.oDialog = new Dialog({
				resizable: true,
				content: this.oMessageView,
				title: this._title,
				beginButton: new Button({
					press: function () {
						this.getParent().close();
					},
					text: "Close"
				}),
				contentHeight: "50%",
				contentWidth: "35%",
				verticalScrolling: false
			});

			this.oDialog.open();


		},
		onCloseDialog: function (oEvent) {
			this._oDialog.close();
		},
		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////
		_initModel: function () {

			this._oLogDialogModel = new sap.ui.model.json.JSONModel();
			this.resetModeData();
			this.setModel(this._oLogDialogModel, "logDialogModel");


		}

	});
	return oLogDialog;
});
