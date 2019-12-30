sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/model/Filter",
	"sap/m/MessageToast"
], function (JSONModel, Device, MessageToast, Filter) {
	"use strict";
	//////////////////////////////////
	//                              //
	//      Internal properties     //
	//                              //
	//////////////////////////////////
	var _sLanguage,
		_bMock = true,
		_aoModel = [],
		_oMockDataModel = new JSONModel(),
		_baseDir;

	//////////////////////////////////
	//                              //
	//        List of services      //
	//                              //
	//////////////////////////////////
	var _mService = {
		getViews: {
			serviceName: "/getViews",
			bUseMock: true,
			mockFile: "/getViews.json",
			oDataModel: "masterData"
		}
	};

	//////////////////////////////////
	//                              //
	//        Public methods        //
	//                              //
	//////////////////////////////////
	var oBaseModelHandler = {

		getModel: function (sModel) {
			var aoModel = _aoModel.filter(function (oModel) {
				return oModel.name === sModel;
			});

			return aoModel[0].model;
		},

		getOdatalUrl: function (sModelName) {
			return this.getModel(sModelName).sServiceUrl;
		},

		getBaseServices: function () {
			return _mService;
		},

		setConfig: function (aoModels, sLang, sMock) {
			_aoModel = aoModels,
				_sLanguage = sLang;
			oBaseModelHandler.setMockMode(sMock);
		},

		getMock: function () {
			return _bMock;
		},

		setBaseDir: function (sDir) {
			_baseDir = sDir;
		},

		setMockMode: function (sMock) {
			var bMock;
			switch (sMock) {
				case "true":
					sap.m.MessageToast.show("Running on MOCK");
					bMock = true;
					break;
				case "mix":
					sap.m.MessageToast.show("Running on MIX mock");
					bMock = undefined;
					break;
				default:
					bMock = false;
			}
			_bMock = bMock;
		},

		loadMockData: function (oServiceConfig, oParam) {
			_oMockDataModel.loadData(jQuery.sap.getModulePath(_baseDir) + oServiceConfig.mockFile, undefined, false);
			if (oParam.success) {
				oParam.success(_oMockDataModel.getData());
			}
		},
		/** @param {object} oServiceConfig: Contains the below properties
		 * @param {object} oParam: Contains the below properties. The properties specified with ? are optional
		 * oParam.operation ? {string} - Request type (the default value is READ)
		 * oParam.oRequestData ? {object} - Data to hand over with the request
		 * oParam.success ? {function} - Callback function to execute if the service request is successful
		 * oParam.error ? {function} - Callback function to execute if the service request fails
		 * oParam.urlParameters ? {object} - Additional URL parameters to use in the request
		 * oParam.filters ? {object} - Array of filters to include in the request
		 * oParam.bSynchronous ? {boolean} - Boolean to specify whether the request must be synchronous (the default value is false)
		 * @return {object} ajax call
		 */
		callSapService: function (oServiceConfig, oParam) {
			oParam = oParam || {};
			// Se recupera el modelo donde se guardarán los datos de la configuración
			var sapUserModelOData = this.getModel(oServiceConfig.oDataModel);
			// se pone el contexto actual a una variable 
			var that = this;

			// Petición
			var oRequest;
			// Parámetros de la petición
			var oRequestParams = {
				// Función si va todo bien
				success: function (oResponse) {
					// Si hay respuesta y es erronea entonces se muestra un mensaje y se llama a la función de error
					// pasada en los parámetros
					if (oResponse && oResponse.EType === "E") {
						jQuery.sap.log.error("Error at service call: " + oServiceConfig.serviceName);
						if (oParam.error) {
							oParam.error.apply(this, arguments);
						}
					} else {
						// Si no hay error se llama a la función succes pasada por parámetro
						if (oParam.success) {
							oParam.success.apply(this, arguments);
						}
					}
				},
				// Función si se produce un error en la llamada
				error: function (oResponse) {
					/* GENERAL MESSAGE AT EVERY ERROR CALLBACK  */
					if (oResponse.statusCode === 500) {
						MessageToast.show("There was an error with SAP communication");
					} else {
						var oJsonResponse = oResponse && oResponse.responseText ? JSON.parse(oResponse.responseText) : undefined;

						if (oJsonResponse && oJsonResponse.error && oJsonResponse.error.message && oJsonResponse.error.message.value) {
							MessageToast.show(oJsonResponse.error.message.value);
						}
					}
					oParam.error.apply(this, arguments);
				},
				urlParameters: this.getUrlParameters(oParam.urlParameters),
				async: oParam.bSynchronous === true ? false : true
			};
			// Si el parámetro "mock" de la URL esta informado, o si no lo esta, a nivel de servicio si que se indica se leen los datos
			// del mock
			if (_bMock === true || (_bMock === undefined && oServiceConfig.bUseMock)) { // use mock data
				that.loadMockData(oServiceConfig, oParam);
			} else {
				// Use real backend ODATA CRUD functions

				switch (oParam.operation) {
					case "CREATE":
						oRequest = sapUserModelOData.create(
							oServiceConfig.serviceName,
							oParam.oRequestData,
							oRequestParams
						);
						break;
					case "UPDATE":
						sapUserModelOData.update(
							oServiceConfig.serviceName,
							oParam.oRequestData,
							oRequestParams
						);
						break;
					case "DELETE":
						oRequest = sapUserModelOData.remove(
							oServiceConfig.serviceName,
							//  oParam.oRequestData,
							oRequestParams
						);
						break;
					default: // "READ":
						if (oParam.filters) {
							oRequestParams.filters = oParam.filters;
						}
						oRequest = sapUserModelOData.read(
							oServiceConfig.serviceName,
							oRequestParams
						);
						break;

				}
			}
			return oRequest;
		},
		/* Obtención de los parámetros de la URL
		*/
		getUrlParameters: function (mUrlParameters) {
			return jQuery.sap.extend({}, mUrlParameters);
		},
		//////////////////////////////////	
		//        Services              //	
		//////////////////////////////////		  
		getViews: function (oParameters, successHandler, errorHandler) {

			// Variable local que indica si el Gateway esta disponible
			var gwAvailable = false;
			// Guardo el contexto actual en una variable local
			var that = this;
			// Se recupera el modelo donde se guardará la información
			var oModel = this.getModel(_mService.getViews.oDataModel);
			
			// Cuando se llama a un servicio en el gateway lo habitual es lanzar el $metadata del servicio para que se refresque
			// internamente el modelo de datos. Con el "attachMetadataLoaded" lo que se hace es añadir una función para que cuando se termine de cargar
			// el metadatos se ejecute el código pasado. De esta manera queda garantizado la carga del metadata antes de llamar al servicio.
			// Este servicio se usan dos parámetros: el primer es la función que se ejecuta cuando se produzca el evento, en este caso, es
			// llamar al sericio. El segundo es el "listener" que en este caso se pasa el propio contexto
			oModel.attachMetadataLoaded(function () {
				
				// Si entra aquí es que hay gateway por lo tanto cambio a true la variable local desde donde se llama
				that.gwAvailable = true;

				// Lo que hace el extend, reemplazado por el merge, es concatenar varios objetos en uno solo.
				/*var mLocalService = jQuery.sap.extend(true, {}, _mService.getViews, {
					serviceName: oModel.createKey(_mService.getViews.serviceName, {
						LANGU: _sLanguage
					})
				}); */
				var mLocalService = merge({}, _mService.getViews, {
					serviceName: oModel.createKey(_mService.getViews.serviceName, {
						LANGU: _sLanguage
					})
				});

				// Se llama al servicio para obtener los datos de Gateway o del mock
				this.callSapService(mLocalService, {
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
				this);

			// Se llama al servicio para obtener los datos del mock si no hay Gateway
			if (!gwAvailable) {
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
			}

		}
	};

	return oBaseModelHandler;
});
