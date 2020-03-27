sap.ui.define([
	"sap/ui/core/Control",
	"sap/ui/core/Fragment"
], function (Control,Fragment) {
	"use strict";

	var oConfirmDialog = Control.extend("com.ivancio.zal30-ui5.component.general.ConfirmDialog.ConfirmDialog", {

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
				//this._oDialog = sap.ui.xmlfragment(this.getId() + "--logDialog", "com.daufood.sat.component.general.LogDialog.MessageViewDialog", this);
				//this.addDependent(this._oDialog);
				Fragment.load({
					id: this.getId() + "--ConfirmDialog",
					name: "com.ivancio.zal30-ui5.component.general.ConfirmDialog.ConfirmDialog",
					controller: this
				}).then(function (oDialog) {
					that._oDialog = oDialog;
					// connect dialog to the root view of this component (models, lifecycle)
					that.addDependent(oDialog);	
					that._oDialog.open();
				});
			}
			else{
				this._oDialog.open();
			}

			
		},
		// Informa los valores que se mostrarán en la ventana de confirmación
		setValues: function (sTitle, sTextMessage, sBeginButtonText, sEndButtonText) {
			this._oConfirmDialogModel.setProperty("/title", sTitle); 
			this._oConfirmDialogModel.setProperty("/textMessage", sTextMessage); 
			this._oConfirmDialogModel.setProperty("/beginButtonText", sBeginButtonText); 
			this._oConfirmDialogModel.setProperty("/endButtonText", sEndButtonText); 
		},
		// Evento al pulsar el botón de inicio
		onBeginButtonDialog:function(oEvent){
			debugger;

		},
		onEndButtonDialog:function(oEvent){
			debugger;
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
