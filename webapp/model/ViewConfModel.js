sap.ui.define([
	"com/ivancio/zal30-ui5/model/ViewBaseModel",
	"com/ivancio/zal30-ui5/service/ViewConfService"
], function (
	ViewBaseModel,
	ViewConfService
) {
	"use strict";


	var oViewConfModel = ViewBaseModel.extend("com.ivancio.zal30-ui5.model.ViewBaseModel", {
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////	
		constructor: function (oComponent) {
			ViewBaseModel.call(this, oComponent);

			// Se instancian los servicios que usará el modelo
			this._initServices();


		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////	
		_initServices: function () {
			// Se instancia el servicio de configuración de la vista pasandole: contexto del component necesario para poder acceder
			// al modelo de la aplicación definido en el manifest y los parámetros generales de como ha de funcionar los servicios.			
			this._oViewConfService = new ViewConfService(this._oOwnerComponent, {
				language: "EN",
				mockDataDir: "com.ivancio.zal30-ui5.localService"
			});

		}
	});
	return oViewConfModel;
});
