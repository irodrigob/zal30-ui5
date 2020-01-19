sap.ui.define([
	"com/ivancio/zal30-ui5/service/CoreService",
	"sap/base/util/merge",
	"sap/ui/model/Filter",
	"com/ivancio/zal30-ui5/constants/constants"
], function (CoreService, merge, Filter,constants) {
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
		}
	};


	var oViewConfService = CoreService.extend("com.ivancio.zal30-ui5.service.ViewConfService", {
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////		  
		constructor: function (oComponent, mConf) {

			// Se llama el core de los servicios pasandole los parámetros recibidos
			CoreService.call(this, oComponent, mConf);

			// Se añade la configuración propia para acceder a los servicios

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
		getViews: function (oParameters, oSuccessHandler, oErrorHandler) {

			// Variable local que indica si el Gateway esta disponible
			var bgwAvailable = false;

			// Se recupera el modelo donde se guardarC! la informaciC3n
			var oModel = this.getModel(_mService.getViews.oDataModel);

			/* Cuando se llama a un servicio en el gateway lo habitual es lanzar el $metadata del servicio para que se refresque
			 internamente el modelo de datos. Con el "attachMetadataLoaded" lo que se hace es añadir una función para que cuando se termine de cargar
			 el metadatos se ejecute el codigo pasado. De esta manera queda garantizado la carga del metadata antes de llamar al servicio.
			 Este servicio se usan dos parametros: el primer es la funcion que se ejecuta cuando se produzca el evento, en este caso, es
			 llamar al sericio. El segundo es el "listener" que en este caso se pasa el propio contexto
			 NOTA: Con el cambio al modelo avanzado de programación en UI5 el método "attachMetadataLoaded" no funciona porque, creo, que
			 esta fuera del contexto de los objetos de UI5 como el component.js. Por eso, se cambia por otro método para garantizar que
			 cuando este cargado el metadata es cuando se leeran las vistas. El codigo antiguo sea deja por conocimientos internos y que no pierda
			*/
			/*oModel.attachMetadataLoaded(function () {
		    //},
			this);*/
			oModel.metadataLoaded().then(() => {
				// Si entra aqui es que hay gateway por lo tanto cambio a true la variable local desde donde se llama
				bgwAvailable = true;


				// Se le pasa el filtro de idioma
				var oFilters = [new Filter(constants.services.filter.langu, sap.ui.model.FilterOperator.EQ, this._sLanguage)];
				// Si el parámetro existe entonces se añade un segundo filtro
				if (oParameters && oParameters.view)
					oFilters.push(new Filter(constants.services.filter.viewName, sap.ui.model.FilterOperator.EQ, oParameters, view));


				// Se llama al servicio para obtener los datos de Gateway o del mock
				this.callSapService(_mService.getViews, {
					filters: oFilters,
					success: function (oData) {
						if (oSuccessHandler) {
							if (oData) {
								oSuccessHandler(oData);
							} else {
								if (oErrorHandler) {
									oErrorHandler();
								}
							}
						}
					},
					error: oErrorHandler
				});
			});



			/*
				// Se llama al servicio para obtener los datos del mock si no hay Gateway
			if (!bgwAvailable) {
				_bMock = true; // Sin gateway todo tiene que por mock
				this.callSapService(_mService.getViews, {
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
			} */

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

		}
		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////


	});
	return oViewConfService;
});
