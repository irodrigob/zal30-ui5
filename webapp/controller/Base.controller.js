sap.ui.define([
    "sap/ui/core/mvc/Controller"    
], function (Controller) {
	"use strict";

	return Controller.extend("com.ivancio.zal30-ui5.controller.Base", {

		_mSections: {
			viewSelect: "viewSelect",
			viewData: "viewData"
		},

		//////////////////////////////////
		//                              //
		//        Public methods        //
		//                              //
		//////////////////////////////////
		onInit: function () {
			this._oOwnerComponent = this.getOwnerComponent();
			this._oAppDataModel = this._oOwnerComponent.getModel("appData");

		},
		// Navega a la rutina especificada con los parC!metros indicados
		navRoute: function (sRoute, oParameters) {
			var oRouter = this._oOwnerComponent.getRouter();

			oRouter.navTo(sRoute, oParameters || {});
		}
        

	});
});
