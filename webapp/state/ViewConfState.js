sap.ui.define([
	"com/ivancio/zal30-ui5/state/ViewBaseState",
	"com/ivancio/zal30-ui5/service/ViewConfService",
	"com/ivancio/zal30-ui5/constants/constants",
	"com/ivancio/zal30-ui5/model/View"
], function (ViewBaseState, ViewConfService, constants, View) {
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
		readView: function (sViewName, oSuccessHandler, oErrorHandler) {
			var that = this;

			// Se lee la configuración de la vista			
			this._oViewConfService.readView({
				viewName: sViewName
			}).then((result) => {					
				debugger;
			},
			(error) =>{
			
			});
			/*this._oViewConfService.readView({
					viewName: sViewName
				},
				function (oData) {
					debugger;
					var oView = new View(that._oOwnerComponent);
					oView.setFieldCatalog(oData.results);
					// Si se le pasado parámetros para el success se ejecuta
					if (oSuccessHandler) {
						oSuccessHandler(oView);
					}
					return oView;
				},
				// funcion sin nombre se llama a si misma sin necesidad de hacerlo manualmente
				function () {

					// Si se le pasado parámetros para el error se ejecuta
					if (oErrorHandler) {
						oErrorHandler();
					}
				});*/

		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////	
		_initServices: function () {
			// Se instancia el servicio de configuraciOn de la vista pasandole: contexto del component necesario para poder acceder
			// al modelo de la aplicacion definido en el manifest
			this._oViewConfService = new ViewConfService(this._oOwnerComponent);

		}
	});
	return oViewConfState;
});
