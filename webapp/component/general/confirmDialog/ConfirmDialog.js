sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";

	var oConfirmDialog = Control.extend("com.ivancio.zal30-ui5.component.general.LogDialog.logDialog", {

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
