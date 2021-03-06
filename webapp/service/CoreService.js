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
		// Llamada a los servicio oData mediante funcionalidad Promise.
		callOData: function (oService) {
			var that = this;
			var model = this.getModel(oService.oDataModel);
			var url = oService.serviceName;
			var core = {
				ajax: function (type, url, data, parameters) {
					var promise = new Promise(function (resolve, reject) {
						// Si el parámetro "mock" de la URL esta informado, o si no lo esta, a nivel de servicio si que se indica se leen los datos
						// del mock
						if (that._bMock === true || (that._bMock === undefined && oServiceConfig.bUseMock)) { // use mock data
							resolve({
								data: that.loadMockDataPromise(oService, that)
							});
						} else {
							var args = [];
							var params = {};
							args.push(url);
							if (data) {
								args.push(data);
							}
							if (parameters) {
								params = parameters;
							}
							params.success = function (result, response) {
								resolve({
									data: result,
									response: response
								});
							};
							params.error = function (error) {

								// Se monta una estructura de error generica para homogenizar los posibles tipos de error
								var mError = {
									statusCode: error.statusCode,
									statusText: error.statusText,
									message: ""
								};
								// Segun el status de error el proceso como se trata el mensaje puede variar
								if (error.statusCode == 500) {
									// El texto completo esta en el tag message dentro del XML generado.									
									mError.message = $(error.responseText).find("message").text();
								} else if (error.statusCode >= 400 && error.statusCode <= 500) {
									// Nota: En los bad request aunque desde SAP se devuelvan dos excepciones solo recoge la última. Pero lo gracioso es que el message manager
									// recoge las dos.							
									var oErrorData = JSON.parse(error.responseText); // Se pasa la respuesta a un JSON para sacar el mensaje
									mError.message = oErrorData.error.message.value;
								} else {
									// Cualquier otro error devuelve el mensaje devuelto
									mError.message = error.responseText;
								}
								reject(mError);
							};
							args.push(params);
							model[type].apply(model, args);
						}
					});

					return promise;
				}
			};

			return {
				'get': function (params) {
					return core.ajax('read', url, false, params);
				},
				'post': function (data, params) {
					return core.ajax('create', url, data, params);
				},
				'put': function (data, params) {
					return core.ajax('update', url, data, params);
				},
				'delete': function (params) {
					return core.ajax('remove', url, false, params);
				}
			};
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
		// Lo primera que se lanza es la lectura del metada de los servicios. Puede ocurrir que el metada se este leyendo y los servicios
		// se ejecute con lo que empezarán a fallar. Por ello se encapsula en una función para que cuando termine se empiece a ejecutar el resto de
		// de servicio.
		// Hacerlo de esta manera simplifica la llamada a otros servicios y su control de errores. Ya que si pusiera el servicio dentro del then 
		// no funciona el then en el servicio que llama a este. Ya que un return de un promise dentro de un then no funciona. Hay que hacerlo en funciones
		// separadas		
		loadMetadata: function (sModelName) {
			// Se recupera el objeto oData para poder hacer las llamadas
			var oModel = this.getModel(sModelName);
			return oModel.metadataLoaded(true);

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
