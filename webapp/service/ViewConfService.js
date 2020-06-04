sap.ui.define([
	"com/ivancio/zal30-ui5/service/CoreService",
	"sap/base/util/merge",
	"sap/ui/model/Filter",
	"com/ivancio/zal30-ui5/constants/constants"
], function (CoreService, merge, Filter, constants) {
	"use strict";

	//////////////////////////////////
	//                              //
	//        List of services      //
	//                              //
	//////////////////////////////////
	var _mService = {
		getViews: {
			serviceName: "/getViewsSet",
			bUseMock: false,
			mockFile: "/getViews.json",
			oDataModel: "masterData"
		},
		checkAuthView: {
			serviceName: "/checkAuthViewSet",
			bUseMock: false,
			mockFile: "/checkAuthView.json",
			oDataModel: "masterData"
		},
		readView: {
			serviceName: "/readViewSet",
			bUseMock: false,
			mockFile: "/readView.json",
			oDataModel: "masterData"
		}
	};

	return CoreService.extend("com.ivancio.zal30-ui5.service.ViewConfService", {
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////		  
		constructor: function (oComponent) {

			// Se llama el core de los servicios pasandole los parámetros recibidos
			CoreService.call(this, oComponent);

			// Se informan los modelos oData donde se obtendrán los datos	
			this.setModelOdata([{
				name: "masterData",
				model: this._oOwnerComponent.getModel("masterData")
			}]);

			// Se informa el directorio donde están los datos del mock
			this.setMockBaseDir("com.ivancio.zal30-ui5.localService");
		},
		//////////////////////////////////	
		//        Services              //	
		//////////////////////////////////	
		// Lo primera que se lanza es la lectura del metada de los servicios. Puede ocurrir que el metada se este leyendo y los servicios
		// se ejecute con lo que empezarán a fallar. Por ello se encapsula en una función para que cuando termine se empiece a ejecutar el resto de
		// de servicio.
		// Hacerlo de esta manera simplifica la llamada a otros servicios y su control de errores. Ya que si pusiera el servicio dentro del then 
		// no funciona el then en el servicio que llama a este. Ya que un return de un promise dentro de un then no funciona. Hay que hacerlo en funciones
		// separadas
		loadMetadata: function () {
			// Se recupera el objeto oData para poder hacer las llamadas
			var oModel = this.getModel(_mService.getViews.oDataModel);
			return oModel.metadataLoaded();

		},
		getViews: function (oParams, bGWAvailable) {
			var that = this;

			if (bGWAvailable) {
				// Se le pasa el filtro de idioma
				var oFilters = [new Filter(constants.services.filter.langu, sap.ui.model.FilterOperator.EQ, this._sLanguage)];
				// Si el parámetro existe entonces se añade un segundo filtro
				if (oParams && oParams.viewName)
					oFilters.push(new Filter(constants.services.filter.viewName, sap.ui.model.FilterOperator.EQ, oParams.viewName));

				// Debido a que el servicio oData se llama dentro de un promise no se puede hacer un return porque quien lo llama no recuperan bien el return y falla
				// en el then. Por eso, se ejecuta el código de los handler				
				return this.callOData(_mService.getViews).get({
					filters: oFilters
				});
			} else {

				// Se llama al servicio para obtener los datos del mock si no hay Gateway
				this._bMock = true; // Sin gateway todo tiene que por mock

				return this.callOData(_mService.getViews).get({}).then((result) => {
						oSuccessHandler(result.data);
					},
					(error) => {
						oErrorHandler(error);
					});
			}

		},
		// Obtiene la autorización para la vista
		checkAuthView: function (oParameters, successHandler, errorHandler) {
			// Se recupera el modelo donde se guardarC! la informaciC3n
			var oModel = this.getModel(_mService.checkAuthView.oDataModel);

			var mLocalService = merge({}, _mService.checkAuthView, {
				serviceName: oModel.createKey(_mService.checkAuthView.serviceName, {
					VIEWNAME: oParameters.viewname
				})
			});

			// Se llama al servicio  	
			this.callSapService(mLocalService, {
				bSynchronous: true, // Tiene que ser sincrono para saber la respuesta inmediata
				success: function (oData) {
					if (successHandler) {
						if (oData) {
							successHandler(oData);
						} else {
							if (errorHandler) {
								errorHandler();
							}
						}
					}
				},
				error: errorHandler
			});

		},
		// Lectura de la vista
		readView: function (oParameters, successHandler, errorHandler) {

			// Se le pasa el filtro de idioma
			var oFilters = [new Filter(constants.services.filter.langu, sap.ui.model.FilterOperator.EQ, this._sLanguage),
				new Filter(constants.services.filter.viewName, sap.ui.model.FilterOperator.EQ, oParameters.viewName),
				new Filter(constants.services.filter.mode, sap.ui.model.FilterOperator.EQ, oParameters.mode)
			];
			return this.callOData(_mService.readView).get({
				filters: oFilters
			})

		},
		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////
		_getViews: function (oParams) {

		},


	});

});
