sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"sap/base/util/merge",
	"sap/ui/model/Filter",
	"com/ivancio/zal30-ui5/constants/constants",
	"sap/m/MessageToast"
], function (Object, JSONModel, merge, Filter, constants, MessageToast) {
	"use strict";

	return Object.extend("com.ivancio.zal30-ui5.service.CoreService", {

		//////////////////////////////////
		//                              //
		//        Public methods        //
		//                              //
		//////////////////////////////////
		constructor: function (oComponent) {

			// Se inicializan las variables locales que son necesarias para acceder al modelo de datos
			this._oOwnerComponent = oComponent;
			this._oAppDataModel = this._oOwnerComponent.getModel("appData");
			this._oI18nResource = this._oOwnerComponent.getModel("i18n").getResourceBundle();

			// Llamada al metodo padre
			Object.call(this);

			// Establece la configuración inicial para la llamada a los servicios
			this._initConfiguration();

		},

		getModel: function (sModel) {
			var aoModel = this._aoModel.filter(function (oModel) {
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

		// Establece el modelo oData para la obtención de los datos
		setModelOdata: function (aoModels) {
			this._aoModel = aoModels;
		},
		// Establece la ruta base donde se buscarán los ficheros
		setMockBaseDir: function (sBaseDir) {
			this._MockbaseDir = sBaseDir;
		},

		getMock: function () {
			return this._bMock;
		},

		setBaseDir: function (sDir) {
			this._baseDir = sDir;
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
			this._bMock = bMock;
		},
		// Establece el lenguaje en la llamada a los servicios
		setLanguage: function (sLang) {
			this._sLanguage = sLang;
		},
		// Devuelve el idioma de los servicios
		getLanguage: function () {
			return this._sLanguage;
		},

		loadMockData: function (oServiceConfig, oParam) {
			this._oMockDataModel.loadData(jQuery.sap.getModulePath(this._MockbaseDir) + oServiceConfig.mockFile, undefined, false);
			if (oParam.success) {
				oParam.success(this._oMockDataModel.getData());
			}
		},
		loadMockDataPromise: function (oServiceConfig, oContext) {
			oContext._oMockDataModel.loadData(jQuery.sap.getModulePath(oContext._MockbaseDir) + oServiceConfig.mockFile, undefined, false);
			return oContext._oMockDataModel.getData();
		},
		callOData: function (oServiceConfig, oParam) {
			var that = this;

			var oPromise = new Promise(function (resolve, reject) {

				oParam = oParam || {}; // Si no hay parámetros se inicializan
				var sapUserModelOData = that.getModel(oServiceConfig.oDataModel); // Modelo para poder llamar al oData de SAP
				var oRequestParams = {
					success: function (oResponse) {
						resolve(oResponse)
					},
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
						reject(oResponse);

					}
				};

				// Si el parámetro "mock" de la URL esta informado, o si no lo esta, a nivel de servicio si que se indica se leen los datos
				// del mock
				if (that._bMock === true || (that._bMock === undefined && oServiceConfig.bUseMock)) { // use mock data
					resolve(that.loadMockDataPromise(oServiceConfig, that));
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
							sapUserModelOData.read(
								oServiceConfig.serviceName,
								oRequestParams
							);
							break;

					}
				}

			});
			return oPromise;

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
			if (this._bMock === true || (this._bMock === undefined && oServiceConfig.bUseMock)) { // use mock data
				this.loadMockData(oServiceConfig, oParam);
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
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////

		// Inicializa la configuración inicial de determinadas variables para la llamada de los servicios
		_initConfiguration() {

			// Se recupera los parametros de la URL. 
			// En los parametros habria uno que sera el MOCK que indica de donde se obtienen los valores: true todo vendra de los ficheros o mix que dependera
			// del atributo "bUseMock" del array de servicios en el fichero models.js.
			var oUrlParams = jQuery.sap.getUriParameters().mParams;

			// Si el parámetro de mock no se pasa se asume que los datos serán reales
			this.setMockMode((oUrlParams.mock && oUrlParams.mock[0]) ? oUrlParams.mock[0] : false);

			// Si no se pasa idioma por parámetro se establece el idioma ingles
			this.setLanguage((oUrlParams.langu && oUrlParams.langu[0]) ? oUrlParams.langu[0] : "EN");

			this._oMockDataModel = new JSONModel();
		}
	});
});
