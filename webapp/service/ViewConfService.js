sap.ui.define([
	"com/ivancio/zal30-ui5/service/CoreService",
	"sap/base/util/merge",
	"sap/ui/model/Filter"
], function (CoreService, merge, Filter) {
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
			// A la configuración pasada se le añade el directorio donde estarán los ficheros mock
			var mExtConf = merge({}, mConf, {
				mockDataDir: "com.ivancio.zal30-ui5.localService"
			});

			// Se llama el core de los servicios pasandole los parámetros recibidos
			CoreService.call(this, oComponent, mExtConf);

			// Se añade la configuración propia para acceder a los servicios
			this._addOwnConfig();
		},
		//////////////////////////////////	
		//        Services              //	
		//////////////////////////////////		  
		getViews: function (oParameters, successHandler, errorHandler) {

			// Variable local que indica si el Gateway esta disponible
			var bgwAvailable = false;
			// Guardo el contexto actual en una variable local
			var that = this;
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
				debugger;
				// Si entra aqui es que hay gateway por lo tanto cambio a true la variable local desde donde se llama
				bgwAvailable = true;

				// Se llama al servicio para obtener los datos de Gateway o del mock				
				this.callSapService(_mService.getViews, {
					filters: [new Filter("LANGU", sap.ui.model.FilterOperator.EQ, this._sLanguage)],
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
		// Obtiene la autorizaciC3n para la vista
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
		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////
		_addOwnConfig: function (mConf) {

			// Se informan los modelos oData donde se obtendrán los datos	
			this.setConfig([{
				name: "masterData",
				model: this._oOwnerComponent.getModel("masterData")
			}]);
		}

	});
	return oViewConfService;
});
