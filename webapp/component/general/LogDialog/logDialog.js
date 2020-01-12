sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";

	var oLogDialog = Control.extend("com.ivancio.zal30-ui5.component.general.LogDialog.logDialog", {

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
		_modelData: {
			messages: [],
			title: ""
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
		resetModeData: function () {
			this._oLogDialogModel.setData(this._modelData);
		},
		// Devuelve el tipo de mensaje para el control en base al tipo de mensaje del modelo
		formatMessageType: function (sType) {
			return this._mTypeCode[sType];
		},
		addMessage: function (sType, sMessage) {
			var aMessages = this._oLogDialogModel.getProperty("/messages");

			aMessages.push({
        type: sType,
        message:sMessage
			});

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
