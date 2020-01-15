sap.ui.define([
	"com/ivancio/zal30-ui5/state/ViewBaseState",
	"com/ivancio/zal30-ui5/service/ViewConfService"
], function (
	ViewBaseState,
	ViewConfService
) {
	"use strict";


	var oViewConfState = ViewBaseState.extend("com.ivancio.zal30-ui5.state.ViewBaseState", {
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////	
		constructor: function (oComponent) {
			ViewBaseState.call(this, oComponent);

			// Se instancian los servicios que usarC! el modelo
			this._initServices();
		},
		// Obtiene la lista de vistas 
		getViewList: function () {
			var oAppDataModel = this.getModel("appData");

			// El modelo tiene tres parC!metros: parC!metros del servicio, funcion cuando el servicio va bien, funciC3n cuando el servicio no va bien
			models.getViews(null,
				function (oViews) {
					// El nodo result que siempre devuelve el Gateway no lo queremos en este caso					
					oAppDataModel.setProperty("/viewList", oViews.results);
				},
				// funcion sin nombre se llama a si misma sin necesidad de hacerlo manualmente
				function () {

				});
		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////	
		_initServices: function () {
			// Se instancia el servicio de configuraciC3n de la vista pasandole: contexto del component necesario para poder acceder
			// al modelo de la aplicaciC3n definido en el manifest y los parC!metros generales de como ha de funcionar los servicios.			
			this._oViewConfService = new ViewConfService(this._oOwnerComponent, {
				language: "EN"
			});

		}
	});
	return oViewConfState;
});
