sap.ui.define([
	"sap/ui/core/Control",
	"sap/ui/core/Fragment"
], function (Control, Fragment) {
	"use strict";

	var oConfirmDialog = Control.extend("com.ivancio.zal30-ui5.component.general.confirmDialog.ConfirmDialog", {

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
		resetModeData: function () {
			this._oConfirmDialogModel.setData(this._modelData);
		},
		openDialog: function (oController) {
			this._oController = oController;
			var that = this;

			if (!this._oDialog) {				
				Fragment.load({
					id: this.getId() + "--ConfirmDialog",
					name: "com.ivancio.zal30-ui5.component.general.ConfirmDialog.ConfirmDialog",
					controller: this
				}).then(function (oDialog) {
					that._oDialog = oDialog;
					that.addDependent(oDialog);
					that._oDialog.open();
				});
			} else {
				this._oDialog.open();
			}


		},
		// Informa los valores que se mostrarán en la ventana de confirmación
		/* Campos de los parámetros:
		sTitle: titulo
		sTextMessage:Texto de confirmación
		sBeginButtonText: texto botón inicial
		sEndButtonText: texto botón final
		oCallBackStartButton: Código que se ejecuta al pulsar el botón inicial
		oCallBackEndButton: Código que se ejecuta al pulsar el botón final
		Plantilla del JSON
		{
			sTitle:"",
			sTextMessage:"",
			sBeginButtonText:"",
			sEndButtonText:"",
			oCallBackStartButton:{},
			oCallBackEndButton:{}
		}
		*/
		setValues: function (mParams) {
			this._oConfirmDialogModel.setProperty("/title", mParams.sTitle);
			this._oConfirmDialogModel.setProperty("/textMessage", mParams.sTextMessage);
			this._oConfirmDialogModel.setProperty("/beginButtonText", mParams.sBeginButtonText);
			this._oConfirmDialogModel.setProperty("/endButtonText", mParams.sEndButtonText);
			// Métodos para el boton de inicio y fin
			this._oCallBackStartButton = mParams.oCallBackStartButton ? mParams.oCallBackStartButton : {};
			this._oCallBackEndButton = mParams.oCallBackEndButton ? mParams.oCallBackEndButton : {};
		},
		// Evento al pulsar el botón de inicio
		onBeginButtonDialog: function (oEvent) {
			this._oDialog.close();
			this._oCallBackStartButton(oEvent);
			
		},
		onEndButtonDialog: function (oEvent) {
			this._oCallEndStartButton
			this._oDialog.close();
		},
		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////
		_initModel: function () {

			this._oConfirmDialogModel = new sap.ui.model.json.JSONModel();
			this.setModel(this._oConfirmDialogModel, "ConfirmDialogModel");


		}

	});
	return oConfirmDialog;
});
