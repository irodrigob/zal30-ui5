sap.ui.define([
    "sap/ui/core/mvc/Controller",	
    "com/ivancio/zal30-ui5/model/models"
], function (Controller, models) {
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
		},
        // Realiza la validación génerica de chequeo de autorizacion
        // Esta función permite pasarle que código se quiere que se ejecute si el servicio
        // termina bien o mal
        checkAuthView:function(sViewName,oParams){
            
            var that = this;

            models.checkAuthView({
                viewname: sViewName
            },
            function (oAuth) {

                // Se guarda el nivel de autorización    
                that._oAppDataModel.setProperty("/levelAuth", oAuth.LEVELAUTH);

                // Se llama al parametro success
                oParams.success(oAuth);

            },
            // funcion sin nombre se llama a si misma sin necesidad de hacerlo manualmente
            function () {
                oParams.error();
            });
        }

	});
});
