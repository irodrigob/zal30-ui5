sap.ui.define([
	"com/ivancio/zal30-ui5/state/ViewBaseState",
	"com/ivancio/zal30-ui5/service/ViewConfService",
	"com/ivancio/zal30-ui5/constants/constants",
	"com/ivancio/zal30-ui5/model/viewModel"
], function (ViewBaseState, ViewConfService, constants, viewModel) {
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
		getViewList: function (oParams, oSuccessHandler, oHandlerSAPError) {
			var that = this;

			var oViewConfModel = this._oOwnerComponent.getModel(constants.jsonModel.viewConf);

			// Hasta que no termina la carga del metadata no se pueden lanzar el primer servicio
			this._oViewConfService.loadMetadata(constants.oDataModel.masterData).then((result) => {

					this._oViewConfService.getViews(oParams, true).then((result) => {

							// Hago una excepción y guardo el resultado en el modelo directamente en esta clase. El motivo
							// es que este servicio se puede llamar desde dos sitios distintos y ambos necesitan este valor en 
							// el modelo. Y para no duplicar código lo hago desde un sitio centralizado
							oViewConfModel.setProperty("/viewList", result.data.results);

							oSuccessHandler(result.data.results);
						},
						(mError) => {
							oHandlerSAPError(mError);
						});
				},
				(error) => {
					// Si hay error es que no hay GW y se llama al servicio con en modo mockData
					this._oViewConfService.getViews(oParams, false).then((result) => {
							// Hago una excepción y guardo el resultado en el modelo directamente en esta clase. El motivo
							// es que este servicio se puede llamar desde dos sitios distintos y ambos necesitan este valor en 
							// el modelo. Y para no duplicar código lo hago desde un sitio centralizado
							oViewConfModel.setProperty("/viewList", result.data.results);

							oSuccessHandler(result.data.results);
						},
						(mError) => {
							oHandlerSAPError(mError);
						});
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
		readView: function (mParams, oSuccessHandler, oErrorHandler) {
			var that = this;

			var oPromise = new Promise(function (resolve, reject) {

				// Se lee la configuración de la vista			
				that._oViewConfService.readView({
					viewName: mParams.viewName,
					mode: mParams.editMode
				}).then((result) => {

						// Se llama al método que devuelve el objeto View con la información del catalogo + la general 
						/*var oView = that._instanceViewObject({
							viewName: mParams.viewName,
							fieldCatalog: result.data.results
						});*/

						resolve(result.data.results);
					},
					(error) => {
						reject(error);

					});
			});
			return oPromise;

		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////	
		_initServices: function () {
			// Se instancia el servicio de configuraciOn de la vista pasandole: contexto del component necesario para poder acceder
			// al modelo de la aplicacion definido en el manifest
			this._oViewConfService = new ViewConfService(this._oOwnerComponent);

		},
		// Se instacia el objeto vista con los datos pasados + otros que se determinan
		_instanceViewObject(mParams) {
			// Se instancia el objeto vista que guardará toda la información de la vista pasada por parámetro			
			var oView = new viewModel(this._oOwnerComponent);

			// Se guarda la info general de la vista
			oView.setViewInfo(this.getViewInfo(mParams.viewName));

			// Se guarda el catalogo de campos
			oView.setFieldCatalogFromService(mParams.fieldCatalog);

			return oView;

		},

	});
	return oViewConfState;
});
