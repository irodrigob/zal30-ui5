sap.ui.define([
	"com/ivancio/zal30-ui5/state/ViewBaseState",
	"com/ivancio/zal30-ui5/service/ViewConfService",
	"com/ivancio/zal30-ui5/constants/constants"
], function (ViewBaseState, ViewConfService, constants) {
	"use strict";


	var oViewConfState = ViewBaseState.extend("com.ivancio.zal30-ui5.state.ViewBaseState", {
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////	
		constructor: function (oComponent) {
			ViewBaseState.call(this, oComponent);

			// Se instancian los servicios que usaran el modelo
			this._initServices();

		},
		// Obtiene la lista de vistas 
		getViewList: function (oParams, oSuccessHandler, oErrorHandler) {
			var oViewConfModel = this._oOwnerComponent.getModel(constants.jsonModel.viewConf);

			// El modelo tiene tres parametros: parC!metros del servicio, funcion cuando el servicio va bien, funcion cuando el servicio no va bien
			this._oViewConfService.getViews(oParams,
				function (oViews) {
					// El nodo result que siempre devuelve el Gateway no lo queremos en este caso							
					oViewConfModel.setProperty("/viewList", oViews.results);

					// Si se le pasado parámetros para el success se ejecuta
					if (oSuccessHandler) {
						oSuccessHandler(oViews.results);
					}
				},
				// funcion sin nombre se llama a si misma sin necesidad de hacerlo manualmente
				function () {
					// Si se le pasado parámetros para el error se ejecuta
					if (oErrorHandler) {
						oErrorHandler();
					}
				});
		},
				// Verifica si una vista esta en el listado de vistas
		getViewInfo: function (sViewName) {
			var oViewConfModel = this._oOwnerComponent.getModel(constants.jsonModel.viewConf);			

			// Se recuperan las vista que estC!n en el modelo de datos
			var aViews = oViewConfModel.getProperty("/viewList");

			// Si no existe el find devuelve un "undefined"
			return aViews.find(view => view.VIEWNAME === sViewName)

		},
		// lectura de de la vista: configuración y datos
		readView:function(sViewName, oSuccessHandler, oErrorHandler){

		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////	
		_initServices: function () {
			// Se instancia el servicio de configuraciC3n de la vista pasandole: contexto del component necesario para poder acceder
			// al modelo de la aplicacion definido en el manifest y los parC!metros generales de como ha de funcionar los servicios.			
			this._oViewConfService = new ViewConfService(this._oOwnerComponent, {
				language: "EN"
			});

		}
	});
	return oViewConfState;
});
