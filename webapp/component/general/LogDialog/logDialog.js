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
			this._oLogDialogModel.setProperty("/title", sTitle);
		},
		// Añade un mensaje de manera individual
		addMessage: function (sType, sMessage) {
			var aMessages = this._oLogDialogModel.getProperty("/messages");

			aMessages.push({
				type: sType,
				message: sMessage
			});
			this._oLogDialogModel.setProperty("/messages", aMessages);
		},
		// Añade una lísta de mensajes.
		// Los campos de la estructura de datos deben ser:
		// type: que puede tener los valores S, W, E. Tal como se indica en la variable _mTypeCode
		// message: Mensaje a mostrar
		addMessages: function (aParamMessages) {
			this._oLogDialogModel.setProperty("/", aParamMessages);
		},
		// Función que permite pasar todos los valores de golpe. Este método 
		// siempre hará un reset de los valores precios
		setValues: function (sTitle, aMessages) {

			//this.setTitle(sTitle); // Título
			this.addMessages(aMessages, true); // Se pasan los mensaje y se indica que se reseteen los valores

		},
		// Formatter del tipo de mensaje
		formatterMessageType: function (sType) {
			return this._mTypeCode[sType];
		},
		openDialog: function (oController) {
			this._oController = oController;
			var that = this;

			this._sId = this.getId() + "--LogDialog";

			/*if (!this._oDialog) {
				Fragment.load({
					id: this._sId,
					name: "com.ivancio.zal30-ui5.component.general.logDialog.LogDialog",
					controller: this
				}).then(function (oDialog) {
					that._oDialog = oDialog;
					that.addDependent(oDialog);
					that._oDialog.open();
				});
			} else {
				this._oDialog.open();
			}*/

			var oMessageTemplate = new MessageItem({
				type: "Error",
				title: "{message}"
			});

			this.oMessageView = new MessageView({
				items: {
					path: "/",
					template: oMessageTemplate
				}
			});
			this.oMessageView.setModel(this._oLogDialogModel);

			this.oDialog = new Dialog({
				resizable: true,
				content: this.oMessageView,
				state: 'Error',
				beginButton: new Button({
					press: function () {
						this.getParent().close();
					},
					text: "Close"
				}),
				customHeader: new Bar({
					contentMiddle: [
						new Text({
							text: "Error"
						})
					]
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
